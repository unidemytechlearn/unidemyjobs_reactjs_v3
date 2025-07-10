import { supabase } from './supabase';

export interface ResumeUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export interface ResumeValidationError {
  type: 'size' | 'format' | 'name' | 'upload' | 'network';
  message: string;
}

// Allowed file types for resumes
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_FILE_SIZE = 1024; // 1KB

export function validateResumeFile(file: File): ResumeValidationError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'size',
      message: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`
    };
  }

  if (file.size < MIN_FILE_SIZE) {
    return {
      type: 'size',
      message: 'File appears to be empty or corrupted.'
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      type: 'format',
      message: 'Only PDF, DOC, and DOCX files are allowed.'
    };
  }

  // Check file extension as backup
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      type: 'format',
      message: 'File must have a .pdf, .doc, or .docx extension.'
    };
  }

  // Check file name length
  if (file.name.length > 100) {
    return {
      type: 'name',
      message: 'File name is too long. Please rename your file to be under 100 characters.'
    };
  }

  // Check for invalid characters in filename
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    return {
      type: 'name',
      message: 'File name contains invalid characters. Please remove special characters like < > : " / \\ | ? *'
    };
  }

  return null;
}

export async function uploadResume(file: File, userId: string): Promise<ResumeUploadResult> {
  // Validate file first
  const validationError = validateResumeFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  try {
    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `resume_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Delete existing resume if any
    await deleteExistingResume(userId);

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(uploadData.path);

    // Update profile with resume information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        resume_url: publicUrl,
        resume_file_name: file.name,
        resume_uploaded_at: new Date().toISOString(),
        resume_file_size: file.size
      })
      .eq('id', userId);

    if (updateError) {
      // If profile update fails, clean up the uploaded file
      await supabase.storage
        .from('resumes')
        .remove([uploadData.path]);
      
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return {
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size
    };

  } catch (error) {
    console.error('Resume upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while uploading your resume.');
  }
}

export async function deleteExistingResume(userId: string): Promise<void> {
  try {
    // Get current resume info from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resume_url, resume_file_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.resume_url) {
      return; // No existing resume to delete
    }

    // List files in user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('resumes')
      .list(userId);

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    // Delete all files in user's folder
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('resumes')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
      }
    }

    // Clear resume info from profile
    await supabase
      .from('profiles')
      .update({
        resume_url: null,
        resume_file_name: null,
        resume_uploaded_at: null,
        resume_file_size: null
      })
      .eq('id', userId);

  } catch (error) {
    console.error('Error deleting existing resume:', error);
  }
}

export async function getResumeDownloadUrl(userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('resume_url')
      .eq('id', userId)
      .single();

    return profile?.resume_url || null;
  } catch (error) {
    console.error('Error getting resume URL:', error);
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileTypeIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    default:
      return '📎';
  }
}