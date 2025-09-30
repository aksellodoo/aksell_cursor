import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Upload,
  File,
  FileImage,
  FileVideo,
  FileCode,
  Archive,
  User,
  ChevronDown,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  CalendarIcon,
  Music,
  Image,
  Video,
  Loader2,
  Plus
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FilesTabProps {
  recordType: string;
  recordId: string;
}

interface ChatterFile {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string;
  uploaded_at: string;
  uploaded_by: string;
  description: string;
  confidentiality_level: 'public' | 'department_leaders' | 'directors_admins' | 'private';
  document_group_id: string;
  version_number: number;
  is_current_version: boolean;
  effective_date: string;
  expiry_date: string | null;
  approval_status: 'approved' | 'pending' | 'rejected' | 'needs_correction' | 'auto_cancelled';
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  uploader_profile?: {
    name: string;
  } | null;
}

interface UploadFormData {
  description: string;
  confidentiality_level: 'public' | 'department_leaders' | 'directors_admins' | 'private';
  effective_date: Date | undefined;
  expiry_date: Date | undefined;
  notify_before_expiry: string;
  notify_users: string[];
  notify_department_id: string;
  requires_approval: boolean;
  approval_users: string[];
  approval_department_id: string;
}

interface DocumentGroup {
  document_group_id: string;
  description: string;
  current_version: ChatterFile;
  all_versions: ChatterFile[];
}

export const FilesTab = ({ recordType, recordId }: FilesTabProps) => {
  const [files, setFiles] = useState<ChatterFile[]>([]);
  const [groupedFiles, setGroupedFiles] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const form = useForm<UploadFormData>({
    defaultValues: {
      description: '',
      confidentiality_level: 'public',
      effective_date: new Date(),
      expiry_date: undefined,
      notify_before_expiry: '30 days',
      notify_users: [],
      notify_department_id: '',
      requires_approval: false,
      approval_users: [],
      approval_department_id: ''
    }
  });

  // Fetch departments and users for selects
  const fetchDepartmentsAndUsers = async () => {
    try {
      const [deptResponse, usersResponse] = await Promise.all([
        supabase.from('departments').select('id, name'),
        supabase.from('profiles').select('id, name, role')
      ]);

      // Filter out test departments
      const filteredDepartments = (deptResponse.data || []).filter(dept => 
        !dept.name.includes('[TEST]') && !dept.name.includes('TEST')
      );

      if (filteredDepartments) setDepartments(filteredDepartments);
      if (usersResponse.data) setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching departments and users:', error);
    }
  };

  // Fetch files from database
  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('chatter_files')
        .select(`
          id,
          file_name,
          file_type,
          file_size,
          file_url,
          uploaded_at,
          uploaded_by,
          description,
          confidentiality_level,
          document_group_id,
          version_number,
          is_current_version,
          effective_date,
          expiry_date,
          approval_status,
          requires_approval,
          approved_by,
          approved_at
        `)
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Get user names separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(f => f.uploaded_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const filesWithProfiles = data.map(file => ({
          ...file,
          uploader_profile: profileMap.get(file.uploaded_by) || null
        }));
        
        setFiles(filesWithProfiles);
        groupFilesByDocument(filesWithProfiles);
      } else {
        setFiles([]);
        setGroupedFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Não foi possível carregar os arquivos');
    } finally {
      setLoading(false);
    }
  };

  const groupFilesByDocument = (files: ChatterFile[]) => {
    const groups = new Map<string, DocumentGroup>();
    
    files.forEach(file => {
      const groupId = file.document_group_id;
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          document_group_id: groupId,
          description: file.description,
          current_version: file,
          all_versions: []
        });
      }
      
      const group = groups.get(groupId)!;
      group.all_versions.push(file);
      
      // Update current version if this file is marked as current
      if (file.is_current_version) {
        group.current_version = file;
      }
    });
    
    // Sort versions within each group
    groups.forEach(group => {
      group.all_versions.sort((a, b) => b.version_number - a.version_number);
    });
    
    setGroupedFiles(Array.from(groups.values()));
  };

  useEffect(() => {
    fetchFiles();
    fetchDepartmentsAndUsers();
  }, [recordType, recordId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadModalOpen(true);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!user || selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${recordType}/${recordId}/${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('employee-files')
          .getPublicUrl(fileName);

        // Prepare file metadata (document_group_id will be auto-generated by trigger)
        const fileData = {
          record_type: recordType,
          record_id: recordId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          description: data.description,
          confidentiality_level: data.confidentiality_level,
          effective_date: data.effective_date?.toISOString(),
          expiry_date: data.expiry_date?.toISOString() || null,
          notify_before_expiry: data.expiry_date ? `${data.notify_before_expiry}` : null,
          notify_users: data.notify_users.length > 0 ? data.notify_users : null,
          notify_department_id: data.notify_department_id || null,
          requires_approval: data.requires_approval,
          approval_users: data.requires_approval && data.approval_users.length > 0 ? data.approval_users : null,
          approval_department_id: data.requires_approval && data.approval_department_id ? data.approval_department_id : null
        };

        // Save file metadata to database
        const { error: dbError } = await supabase
          .from('chatter_files')
          .insert(fileData as any);

        if (dbError) throw dbError;
      }

      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso`);
      
      // Reset form and close modal
      form.reset();
      setSelectedFiles([]);
      setUploadModalOpen(false);
      
      // Refresh files list
      await fetchFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar arquivo(s)');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (file: ChatterFile) => {
    // Check if file is pending and user is not uploader or approver
    if (file.approval_status === 'pending' && file.uploaded_by !== user?.id) {
      toast.error('Este arquivo está aguardando aprovação');
      return;
    }
    window.open(file.file_url, '_blank');
  };

  const handleDelete = async (file: ChatterFile) => {
    // Only allow deletion of approved files by uploader
    if (file.approval_status !== 'approved' || file.uploaded_by !== user?.id) {
      toast.error('Apenas arquivos aprovados podem ser excluídos pelo autor');
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('chatter_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      // Extract file path from URL for storage deletion
      const urlParts = file.file_url.split('/');
      const fileName = urlParts.slice(-4).join('/');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('employee-files')
        .remove([fileName]);

      if (storageError) {
        console.warn('Error deleting from storage:', storageError);
      }

      toast.success('Arquivo excluído com sucesso');
      await fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const handleApproval = async (file: ChatterFile, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('chatter_files')
        .update({
          approval_status: approved ? 'approved' : 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', file.id);

      if (error) throw error;

      toast.success(`Arquivo ${approved ? 'aprovado' : 'rejeitado'} com sucesso`);
      await fetchFiles();
    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error('Erro ao atualizar status de aprovação');
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getFileIcon = (type: string | null) => {
    if (!type) return <File className="h-5 w-5 text-blue-600" />;
    
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-600" />;
    } else if (type.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-600" />;
    } else if (type.startsWith('audio/')) {
      return <Music className="h-5 w-5 text-orange-600" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else if (type.includes('zip') || type.includes('rar')) {
      return <Archive className="h-5 w-5 text-yellow-600" />;
    }
    return <File className="h-5 w-5 text-blue-600" />;
  };

  const getConfidentialityBadge = (level: string) => {
    switch (level) {
      case 'public':
        return <Badge variant="secondary" className="text-xs">Público</Badge>;
      case 'department_leaders':
        return <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">Líderes+</Badge>;
      case 'directors_admins':
        return <Badge variant="destructive" className="text-xs">Diretores</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Público</Badge>;
    }
  };

  const getApprovalStatusBadge = (file: ChatterFile) => {
    switch (file.approval_status) {
      case 'approved':
        return <Badge variant="default" className="text-xs bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFileDisabled = (file: ChatterFile) => {
    return file.approval_status === 'pending' && file.uploaded_by !== user?.id;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Arquivos</h3>
          <Badge variant="outline">Carregando...</Badge>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Arquivos</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{files.length} arquivo(s)</Badge>
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => document.getElementById('file-input')?.click()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Arquivo
              </Button>
            </DialogTrigger>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload de Arquivo</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {selectedFiles.length > 0 && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Arquivos selecionados:</p>
                      {selectedFiles.map((file, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          {file.name} ({formatFileSize(file.size)})
                        </p>
                      ))}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição do Documento *</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descreva o que é este documento" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confidentiality_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Confidencialidade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Público - Usuários com acesso ao registro</SelectItem>
                            <SelectItem value="department_leaders">Líderes do Departamento+</SelectItem>
                            <SelectItem value="directors_admins">Apenas Diretores e Administradores</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="effective_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Início de Vigência</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: pt })
                                  ) : (
                                    <span>Vigência imediata</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Validade (Opcional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: pt })
                                  ) : (
                                    <span>Sem validade</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date <= new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requires_approval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Documento necessita aprovação?</FormLabel>
                          <div className="text-xs text-muted-foreground">
                            Se ativado, o documento ficará pendente até aprovação
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('requires_approval') && (
                    <div className="space-y-4 border-l-2 border-primary pl-4">
                      <FormField
                        control={form.control}
                        name="approval_users"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuários Aprovadores</FormLabel>
                            <Select onValueChange={(value) => field.onChange([...field.value, value])}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar usuários" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {field.value.map((userId) => {
                                  const user = users.find(u => u.id === userId);
                                  return (
                                    <Badge key={userId} variant="secondary" className="text-xs">
                                      {user?.name}
                                      <button
                                        type="button"
                                        className="ml-1 text-xs"
                                        onClick={() => field.onChange(field.value.filter(id => id !== userId))}
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="approval_department_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OU Departamento Aprovador</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar departamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUploadModalOpen(false);
                        setSelectedFiles([]);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Arquivo(s)'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {groupedFiles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Novo Arquivo" para fazer upload
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedFiles.map((group) => {
            const currentFile = group.current_version;
            const isDisabled = isFileDisabled(currentFile);
            const isExpanded = expandedGroups.has(group.document_group_id);
            
            return (
              <Card key={group.document_group_id} className={cn(
                "transition-all duration-200",
                isDisabled && "opacity-50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isDisabled ? "bg-gray-100" : "bg-muted"
                      )}>
                        {getFileIcon(currentFile.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            "font-medium text-sm truncate",
                            isDisabled && "text-gray-500"
                          )}>
                            {currentFile.file_name}
                          </p>
                          {getConfidentialityBadge(currentFile.confidentiality_level)}
                          {getApprovalStatusBadge(currentFile)}
                          {group.all_versions.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              v{currentFile.version_number}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>{formatFileSize(currentFile.file_size)}</span>
                          <span>Por {currentFile.uploader_profile?.name || 'Usuário'}</span>
                          <span>{format(new Date(currentFile.uploaded_at), 'dd/MM/yyyy', { locale: pt })}</span>
                          {currentFile.expiry_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Vence em {format(new Date(currentFile.expiry_date), 'dd/MM/yyyy', { locale: pt })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {currentFile.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {group.all_versions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroupExpansion(group.document_group_id)}
                        >
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(currentFile)}
                        disabled={isDisabled}
                        title={isDisabled ? "Arquivo aguardando aprovação" : "Visualizar"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(currentFile)}
                        disabled={isDisabled}
                        title={isDisabled ? "Arquivo aguardando aprovação" : "Baixar"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {currentFile.uploaded_by === user?.id && currentFile.approval_status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(currentFile)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {currentFile.approval_status === 'pending' && currentFile.uploaded_by !== user?.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproval(currentFile, true)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproval(currentFile, false)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Version History */}
                  {group.all_versions.length > 1 && (
                    <Collapsible open={isExpanded}>
                      <CollapsibleContent className="mt-4 pl-4 border-l-2 border-muted">
                        <p className="text-xs font-medium text-muted-foreground mb-3">
                          Histórico de Versões ({group.all_versions.length - 1} versões anteriores)
                        </p>
                        <div className="space-y-2">
                          {group.all_versions
                            .filter(file => !file.is_current_version)
                            .map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Badge variant="outline" className="text-xs">
                                    v{file.version_number}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {file.file_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(file.uploaded_at), 'dd/MM/yyyy', { locale: pt })}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};