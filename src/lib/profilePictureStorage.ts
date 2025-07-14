import { supabase } from './supabase';

export interface ProfilePictureUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export interface ProfilePictureValidationError {
  type: 'size' | 'format' | 'name' | 'upload' | 'network';
  message: string;
}

// Allowed file types for profile pictures
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_FILE_SIZE = 1024; // 1KB

export function validateProfilePictureFile(file: File): ProfilePictureValidationError | null {
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
      message: 'Only JPEG, PNG, and WebP images are allowed.'
    };
  }

  // Check file extension as backup
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      type: 'format',
      message: 'File must have a .jpg, .jpeg, .png, or .webp extension.'
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

export async function uploadProfilePicture(file: File, userId: string): Promise<ProfilePictureUploadResult> {
  // Validate file first
  const validationError = validateProfilePictureFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  try {
    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `profile_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Delete existing profile picture if any
    await deleteExistingProfilePicture(userId);

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
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
      .from('profile-pictures')
      .getPublicUrl(uploadData.path);

    // Update profile with profile picture information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: publicUrl,
        profile_picture_uploaded_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      // If profile update fails, clean up the uploaded file
      await supabase.storage
        .from('profile-pictures')
        .remove([uploadData.path]);
      
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return {
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size
    };

  } catch (error) {
    console.error('Profile picture upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while uploading your profile picture.');
  }
}

export async function deleteExistingProfilePicture(userId: string): Promise<void> {
  try {
    // Get current profile picture info from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.profile_picture_url) {
      return; // No existing profile picture to delete
    }

    // List files in user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-pictures')
      .list(userId);

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    // Delete all files in user's folder
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
      }
    }

    // Clear profile picture info from profile
    await supabase
      .from('profiles')
      .update({
        profile_picture_url: null,
        profile_picture_uploaded_at: null
      })
      .eq('id', userId);

  } catch (error) {
    console.error('Error deleting existing profile picture:', error);
  }
}

export async function getProfilePictureUrl(userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    return profile?.profile_picture_url || null;
  } catch (error) {
    console.error('Error getting profile picture URL:', error);
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

export function getImageTypeIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return '🖼️';
    case 'png':
      return '🖼️';
    case 'webp':
      return '🖼️';
    default:
      return '📷';
  }
}