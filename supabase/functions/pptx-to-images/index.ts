import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversionRequest {
  fileBase64: string;
  fileName: string;
  targetDpi?: number;
}

interface ConversionResponse {
  images: string[];
  slideCount: number;
  success: boolean;
  error?: string;
  processingTime: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { fileBase64, fileName, targetDpi = 300 }: ConversionRequest = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({ error: 'fileBase64 and fileName are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎯 Converting PowerPoint to images: ${fileName}`);
    console.log(`📐 Target DPI: ${targetDpi}`);

    // Convert PowerPoint to images using LibreOffice
    const images = await convertPowerpointToImages(fileBase64, fileName, targetDpi);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Conversion completed in ${processingTime}ms, generated ${images.length} images`);

    const response: ConversionResponse = {
      images,
      slideCount: images.length,
      success: true,
      processingTime
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ PowerPoint conversion error:', error);
    
    const errorResponse: ConversionResponse = {
      images: [],
      slideCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
      processingTime: Date.now() - startTime
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function convertPowerpointToImages(
  fileBase64: string, 
  fileName: string, 
  targetDpi: number
): Promise<string[]> {
  const tempDir = await Deno.makeTempDir({ prefix: 'pptx_conversion_' });
  
  try {
    // Decode base64 and save file
    const fileData = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    const inputPath = `${tempDir}/${fileName}`;
    await Deno.writeFile(inputPath, fileData);

    console.log(`📁 Temporary file saved: ${inputPath}`);

    // Create output directory for images
    const outputDir = `${tempDir}/output`;
    await Deno.mkdir(outputDir, { recursive: true });

    // Convert PowerPoint to images using LibreOffice
    const libreOfficeCmd = new Deno.Command('libreoffice', {
      args: [
        '--headless',
        '--convert-to', 'png',
        '--outdir', outputDir,
        inputPath
      ],
      stdout: 'piped',
      stderr: 'piped'
    });

    console.log('🔄 Running LibreOffice conversion...');
    const libreOfficeResult = await libreOfficeCmd.output();
    
    if (!libreOfficeResult.success) {
      const stderr = new TextDecoder().decode(libreOfficeResult.stderr);
      console.error('LibreOffice conversion failed:', stderr);
      throw new Error(`LibreOffice conversion failed: ${stderr}`);
    }

    // Check if any PNG files were created
    const outputFiles: string[] = [];
    try {
      for await (const dirEntry of Deno.readDir(outputDir)) {
        if (dirEntry.isFile && dirEntry.name.endsWith('.png')) {
          outputFiles.push(`${outputDir}/${dirEntry.name}`);
        }
      }
    } catch (readError) {
      console.error('Error reading output directory:', readError);
    }

    if (outputFiles.length === 0) {
      // Try alternative approach: convert to PDF first, then to images
      console.log('📄 No PNG files found, trying PDF conversion approach...');
      return await convertViaPdf(inputPath, outputDir, targetDpi);
    }

    // Sort files numerically to maintain slide order
    outputFiles.sort((a, b) => {
      const aNum = extractSlideNumber(a);
      const bNum = extractSlideNumber(b);
      return aNum - bNum;
    });

    console.log(`📊 Found ${outputFiles.length} slide images`);

    // Convert images to base64
    const base64Images: string[] = [];
    for (const imagePath of outputFiles) {
      try {
        const imageData = await Deno.readFile(imagePath);
        const base64 = btoa(String.fromCharCode(...imageData));
        base64Images.push(base64);
      } catch (readError) {
        console.error(`Error reading image ${imagePath}:`, readError);
      }
    }

    return base64Images;

  } finally {
    // Cleanup temporary directory
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Warning: Could not cleanup temporary directory:', cleanupError);
    }
  }
}

async function convertViaPdf(
  inputPath: string, 
  outputDir: string, 
  targetDpi: number
): Promise<string[]> {
  const pdfPath = `${outputDir}/temp.pdf`;
  
  // Convert PowerPoint to PDF
  const toPdfCmd = new Deno.Command('libreoffice', {
    args: [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      inputPath
    ],
    stdout: 'piped',
    stderr: 'piped'
  });

  const pdfResult = await toPdfCmd.output();
  if (!pdfResult.success) {
    const stderr = new TextDecoder().decode(pdfResult.stderr);
    throw new Error(`PDF conversion failed: ${stderr}`);
  }

  // Find the generated PDF file
  let actualPdfPath = pdfPath;
  try {
    for await (const dirEntry of Deno.readDir(outputDir)) {
      if (dirEntry.isFile && dirEntry.name.endsWith('.pdf')) {
        actualPdfPath = `${outputDir}/${dirEntry.name}`;
        break;
      }
    }
  } catch (error) {
    console.error('Error finding PDF file:', error);
  }

  // Convert PDF to images using ImageMagick/GraphicsMagick
  const toImagesCmd = new Deno.Command('convert', {
    args: [
      '-density', targetDpi.toString(),
      '-quality', '90',
      actualPdfPath,
      `${outputDir}/slide_%03d.png`
    ],
    stdout: 'piped',
    stderr: 'piped'
  });

  const imagesResult = await toImagesCmd.output();
  if (!imagesResult.success) {
    const stderr = new TextDecoder().decode(imagesResult.stderr);
    throw new Error(`Image conversion failed: ${stderr}`);
  }

  // Collect generated PNG files
  const imageFiles: string[] = [];
  try {
    for await (const dirEntry of Deno.readDir(outputDir)) {
      if (dirEntry.isFile && dirEntry.name.startsWith('slide_') && dirEntry.name.endsWith('.png')) {
        imageFiles.push(`${outputDir}/${dirEntry.name}`);
      }
    }
  } catch (error) {
    console.error('Error collecting image files:', error);
  }

  imageFiles.sort(); // Natural sort for slide_001.png, slide_002.png, etc.

  // Convert to base64
  const base64Images: string[] = [];
  for (const imagePath of imageFiles) {
    try {
      const imageData = await Deno.readFile(imagePath);
      const base64 = btoa(String.fromCharCode(...imageData));
      base64Images.push(base64);
    } catch (readError) {
      console.error(`Error reading image ${imagePath}:`, readError);
    }
  }

  return base64Images;
}

function extractSlideNumber(filename: string): number {
  const match = filename.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}