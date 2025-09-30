import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let authContext: any = null;
  let uploadedDocuments: any[] = [];
  let errors: string[] = [];

  try {
    console.log('Import request received: processing files...');

    // Initialize Supabase client for database operations only
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client that bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Authenticate user
    console.log('🔐 Validating authentication token...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error('Authentication failed:', userError);
      throw new Error(`Authentication failed: ${userError?.message || 'Invalid token'}`);
    }

    authContext = userData.user;
    console.log(`✅ User authenticated: ${authContext.id} (${authContext.email})`);

    // 2. Test database permissions for user
    console.log('🧪 Testing database permissions for user...');
    const { error: testError } = await supabase
      .from('documents')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Database permission test failed:', testError);
      throw new Error(`Database access error: ${testError.message}`);
    }

    console.log('✅ Database connection test successful');

    // Parse form data
    const formData = await req.formData();
    const wizardDataStr = formData.get('wizardData') as string;

    if (!wizardDataStr) {
      throw new Error('wizardData is required');
    }

    const wizardData = JSON.parse(wizardDataStr);
    console.log('Import request received:', {
      filesCount: wizardData.files?.length || 0,
      department_id: wizardData.department_id,
      folder_id: wizardData.folder_id,
      documentStatus: wizardData.documentStatus
    });

    // 3. Validate department access first
    console.log(`🔍 Validating department access: ${wizardData.department_id}`);
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('id, name, document_root_enabled, document_root_folder_id')
      .eq('id', wizardData.department_id)
      .single();

    if (deptError || !department) {
      throw new Error(`Department validation failed: ${deptError?.message || 'Department not found'}`);
    }

    console.log(`✅ Department validated: ${department.name}`);

    // 4. Handle folder validation with auto-creation of root folder if needed
    let folderId = wizardData.folder_id;
    let folder: any = null;

    if (!folderId || folderId === 'null' || folderId === '') {
      // User wants to import to department root - check if we need to create root folder
      console.log('🏠 No folder specified - checking for department root folder...');
      
      if (!department.document_root_enabled) {
        throw new Error('Este departamento não permite documentos na pasta principal');
      }

      if (department.document_root_folder_id) {
        // Root folder already exists
        folderId = department.document_root_folder_id;
        console.log(`📁 Using existing root folder: ${folderId}`);
      } else {
        // Need to create root folder automatically
        console.log('🏗️ Creating root folder automatically...');
        
        const { data: newFolder, error: createFolderError } = await supabase
          .from('folders')
          .insert({
            name: `${department.name} - Documentos`,
            department_id: wizardData.department_id,
            parent_folder_id: null,
            is_root: true,
            created_by: authContext.id
          })
          .select()
          .single();

        if (createFolderError || !newFolder) {
          throw new Error(`Failed to create root folder: ${createFolderError?.message || 'Unknown error'}`);
        }

        // Update department with new root folder ID
        const { error: updateDeptError } = await supabase
          .from('departments')
          .update({ document_root_folder_id: newFolder.id })
          .eq('id', wizardData.department_id);

        if (updateDeptError) {
          console.warn('⚠️ Warning: Failed to update department root folder ID:', updateDeptError);
        }

        folderId = newFolder.id;
        folder = newFolder;
        console.log(`✅ Root folder created: ${newFolder.name} (ID: ${newFolder.id})`);
      }
    }

    if (!folder) {
      // Validate the folder (either existing root or specified folder)
      console.log(`🔍 Validating folder access: ${folderId}`);
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('id, name, department_id')
        .eq('id', folderId)
        .single();

      if (folderError || !folderData) {
        throw new Error(`Folder validation failed: ${folderError?.message || 'Folder not found'}`);
      }

      folder = folderData;
      console.log(`✅ Folder validated: ${folder.name} (dept: ${folder.department_id})`);
    }

    // Update wizardData with the resolved folder ID for downstream processing
    wizardData.folder_id = folderId;

    console.log('✅ Database validation passed, proceeding with file processing...');

    // Status mapping from UI to database
    const statusMapping = {
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado',
      'obsoleto': 'Obsoleto',
      'pendente': 'Pendente'
    };

    // Get files to replace and import anyway from wizard data
    const filesToReplace = wizardData.filesToReplace || [];
    const filesToImportAnyway = wizardData.filesToImportAnyway || [];
    console.log('Files marked for replacement:', filesToReplace);
    console.log('Files marked to import anyway:', filesToImportAnyway);

    // Process each file
    const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file_'));
    console.log(`Processing ${fileEntries.length} files...`);

    for (let i = 0; i < fileEntries.length; i++) {
      const [fileKey, fileValue] = fileEntries[i];
      const file = fileValue as File;

      console.log(`Processing file ${i + 1}/${fileEntries.length}: ${file.name}`);

      // Check if this file should replace an existing document or import anyway
      const shouldReplace = filesToReplace.includes(file.name);
      const shouldImportAnyway = filesToImportAnyway.includes(file.name);
      
      if (shouldReplace) {
        console.log(`File ${file.name} marked for replacement - archiving current version...`);
        
        // Find existing document with same name in the folder
        const { data: existingDocs, error: findError } = await supabase
          .from('documents')
          .select('id, storage_key, version_number')
          .eq('folder_id', wizardData.folder_id)
          .eq('name', file.name)
          .neq('status', 'Obsoleto');

        if (findError) {
          console.error(`Error finding existing document for replacement: ${findError.message}`);
        } else if (existingDocs && existingDocs.length > 0) {
          const existingDoc = existingDocs[0];
          console.log(`Found existing document to replace: ${existingDoc.id}`);
          
          try {
            // Archive current version instead of deleting
            const { data: versionId, error: archiveError } = await supabase.rpc('archive_document_version', {
              p_document_id: existingDoc.id,
              p_created_by: authContext.id
            });
            
            if (archiveError) {
              console.error(`Failed to archive current version: ${archiveError.message}`);
              // Continue with replacement even if archiving fails
            } else {
              console.log(`Successfully archived version ${existingDoc.version_number} as ${versionId}`);
            }
          } catch (archiveErr) {
            console.error(`Exception during version archiving: ${archiveErr}`);
            // Continue with replacement
          }
        }
      }

      // Upload file to storage
      const fileExtension = file.name.split('.').pop() || '';
      const storageFileName = `${crypto.randomUUID()}.${fileExtension}`;
      const storagePath = `${wizardData.folder_id}/${storageFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('docs-prod')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error(`Upload failed for ${file.name}:`, uploadError);
        errors.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      console.log(`File uploaded to storage: ${storagePath}`);

      // Prepare document data
      console.log(`📊 Preparing document data for: ${file.name}`);
      console.log(`📁 Folder ID: ${wizardData.folder_id}`);

      // Extract fields from wizard data
      const versioningData = wizardData.versioningData || {};
      
      // Map status from wizard to database value
      const finalStatus = statusMapping[wizardData.documentStatus as keyof typeof statusMapping] || 'Aprovado';
      
      const documentData = {
        name: file.name,
        mime_type: file.type,
        file_size: file.size,
        department_id: wizardData.department_id,
        folder_id: wizardData.folder_id,
        created_by: authContext.id,
        status: finalStatus, // Use status from wizard
        rag_status: 'not_processed', // RAG always starts as not processed
        storage_key: storagePath,
        // Fields from wizard
        description: versioningData.description || null,
        file_type: wizardData.selectedFileType || null,
        effective_date: wizardData.effectiveDate || null,
        expiry_date: wizardData.expiryDate || null,
        version_number: wizardData.versionNumber || 1,
        version_notes: wizardData.versionNotes || null,
        reviewers: wizardData.reviewers || null,
        review_department_id: wizardData.reviewDepartmentId || null,
        approval_mode: wizardData.approvalMode || null,
        approvers: wizardData.approvers || null,
        notify_before_expiry_days: wizardData.notifyBeforeExpiryDays || null
      };

      // Add metadata based on status (as separate fields or in a metadata object)
      const statusMetadata: any = {};
      if (wizardData.documentStatus === 'rejeitado' && wizardData.rejectionReason) {
        statusMetadata.rejection_reason = wizardData.rejectionReason;
      }
      if (wizardData.documentStatus === 'obsoleto' && wizardData.replacementDocument) {
        statusMetadata.replacement_document_id = wizardData.replacementDocument.id;
      }
      if (wizardData.documentStatus === 'pendente' && wizardData.pendingType) {
        statusMetadata.pending_type = wizardData.pendingType;
      }
      
      // Add metadata to document data if any exists
      if (Object.keys(statusMetadata).length > 0) {
        (documentData as any).metadata = statusMetadata;
      }

      console.log('💾 Inserting document data:', documentData);

      // Check for duplicates one more time before insertion (safety check)
      // Skip duplicate check if file is marked to replace or import anyway
      if (!shouldReplace && !shouldImportAnyway) {
        const { data: duplicateCheck, error: duplicateError } = await supabase
          .from('documents')
          .select('id, name')
          .eq('folder_id', wizardData.folder_id)
          .eq('name', file.name)
          .eq('file_size', file.size)
          .neq('status', 'Obsoleto');

        if (duplicateError) {
          console.warn(`Duplicate check failed for ${file.name}: ${duplicateError.message}`);
        } else if (duplicateCheck && duplicateCheck.length > 0) {
          console.error(`Duplicate document detected during insertion: ${file.name}`);
          // Clean up uploaded file
          await supabase.storage.from('docs-prod').remove([storagePath]);
          errors.push(`${file.name}: Documento duplicado detectado. Use a funcionalidade de resolução de duplicatas.`);
          continue;
        }
      } else if (shouldImportAnyway) {
        console.log(`File ${file.name} marked to import anyway - skipping duplicate check for same folder`);
      }

      // Insert document
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (insertError) {
        console.error(`Document insert failed for ${file.name}:`, insertError);
        
        // Check if it's a unique constraint violation (duplicate)
        if (insertError.code === '23505' && insertError.message.includes('documents_unique_file_per_folder')) {
          errors.push(`${file.name}: Arquivo duplicado detectado. Nome e tamanho já existem nesta pasta.`);
        } else {
          errors.push(`${file.name}: ${insertError.message}`);
        }
        
        // Clean up uploaded file
        await supabase.storage.from('docs-prod').remove([storagePath]);
        continue;
      }

      console.log(`Document record created: ${document.id}`);
      
      // Process tags if available
      const tags = versioningData.tags || [];
      
      if (tags.length > 0) {
        console.log(`Processing ${tags.length} tags for document: ${document.id}`);
        
        for (const tagName of tags) {
          try {
            // Use the find_or_create_document_tag function
            const { data: tagId, error: tagError } = await supabase
              .rpc('find_or_create_document_tag', {
                p_tag_name: tagName,
                p_created_by: authContext.id
              });
            
            if (tagError) {
              console.error(`Error creating/finding tag "${tagName}":`, tagError);
              continue;
            }
            
            // Create document-tag relationship
            const { error: relationError } = await supabase
              .from('document_tags')
              .insert({
                document_id: document.id,
                tag_id: tagId,
                created_by: authContext.id
              });
            
            if (relationError) {
              console.error(`Error linking tag "${tagName}" to document:`, relationError);
            } else {
              console.log(`Successfully linked tag "${tagName}" to document: ${document.id}`);
            }
          } catch (tagErr) {
            console.error(`Exception processing tag "${tagName}":`, tagErr);
          }
        }
      }

      uploadedDocuments.push({
        id: document.id,
        name: document.name,
        status: document.status,
        rag_status: document.rag_status,
        folder_id: document.folder_id
      });

      console.log(`✅ Successfully processed: ${file.name}`);
    }

    // Return response
    console.log(`🎯 Import completed. Success: ${uploadedDocuments.length}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: fileEntries.length,
        successful: uploadedDocuments.length,
        failed: errors.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Import function error:', error);
    
    const errorMessage = getErrorMessage(error);
    const errorResponse = {
      success: false,
      error: errorMessage,
      authContext: authContext ? { 
        id: authContext.id, 
        email: authContext.email 
      } : null,
      uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});