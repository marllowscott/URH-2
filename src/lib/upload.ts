import { supabase } from '@/integrations/supabase/client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

const ALLOWED_EXTENSIONS = {
  video: ['mp4', 'webm', 'mov'],
  document: ['pdf'],
  image: ['png', 'jpg', 'jpeg'],
  text: ['txt']
};

const MAX_FILE_SIZES = {
  video: 100 * 1024 * 1024, // 100MB
  document: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024, // 5MB
  text: 1 * 1024 * 1024 // 1MB
};

export function getFileType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (ALLOWED_EXTENSIONS.video.includes(extension || '')) return 'video';
  if (ALLOWED_EXTENSIONS.document.includes(extension || '')) return 'document';
  if (ALLOWED_EXTENSIONS.image.includes(extension || '')) return 'image';
  if (ALLOWED_EXTENSIONS.text.includes(extension || '')) return 'text';
  
  return 'unknown';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const fileType = getFileType(file);
  
  if (fileType === 'unknown') {
    return {
      valid: false,
      error: `Unsupported file type. Allowed: ${Object.values(ALLOWED_EXTENSIONS).flat().join(', ')}`
    };
  }
  
  const maxSize = MAX_FILE_SIZES[fileType as keyof typeof MAX_FILE_SIZES];
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size for ${fileType}: ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { url: '', path: '', error: validation.error };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
    const fullPath = `${path}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('thumbnail')
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('thumbnail')
      .getPublicUrl(fullPath);

    return {
      url: urlData.publicUrl,
      path: fullPath
    };
  } catch (error) {
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function uploadThumbnail(
  file: File,
  courseId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return uploadFile(file, `thumbnails/${courseId}`, onProgress);
}

export async function uploadModuleContent(
  file: File,
  courseId: string,
  moduleId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return uploadFile(file, `courses/${courseId}/modules/${moduleId}`, onProgress);
}

export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('thumbnail')
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

