import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Download, AlertCircle, CheckCircle, Loader, Trash2, User } from 'lucide-react';
import { uploadProfilePicture, deleteExistingProfilePicture, validateProfilePictureFile, formatFileSize, getImageTypeIcon } from '../lib/profilePictureStorage';
import { useAuthContext } from './AuthProvider';

interface ProfilePictureUploadSectionProps {
  currentProfilePictureUrl?: string;
  currentProfilePictureUploadedAt?: string;
  onUploadSuccess?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  onDeleteSuccess?: () => void;
}

const ProfilePictureUploadSection = ({
  currentProfilePictureUrl,
  currentProfilePictureUploadedAt,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess
}: ProfilePictureUploadSectionProps) => {
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileSelect = (file: File) => {
    setValidationError('');
    setSelectedFile(null);
    setPreviewUrl('');

    // Validate file
    const error = validateProfilePictureFile(file);
    if (error) {
      setValidationError(error.message);
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadProfilePicture(selectedFile, user.id);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadProgress(0);
        // Force refresh profile data and call success callback
        onUploadSuccess?.(result.url, result.fileName);
        // Add timestamp to force image refresh
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
          detail: { url: result.url + '?t=' + Date.now() } 
        }));
      }, 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setValidationError(errorMessage);
      onUploadError?.(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmed = window.confirm('Are you sure you want to delete your profile picture? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteExistingProfilePicture(user.id);
      onDeleteSuccess?.();
      // Force refresh profile data
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
        detail: { url: null } 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete profile picture';
      onUploadError?.(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setValidationError('');
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Current Profile Picture Display */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative group">
          <img
            src={currentProfilePictureUrl || "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-300 flex items-center justify-center">
            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <button 
            onClick={triggerFileInput}
            className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-center sm:text-left">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Profile Photo</h4>
          <p className="text-gray-600 text-sm mb-4">Choose a professional photo that represents you well</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={triggerFileInput}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Upload Photo
            </button>
            {currentProfilePictureUrl && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
          {currentProfilePictureUploadedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Uploaded: {new Date(currentProfilePictureUploadedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        id="profile-picture-upload"
      />

      {/* File Upload Area (only show when selecting new file) */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={clearSelection}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
              </div>
            )}

            <div className="flex justify-center space-x-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
              <button
                onClick={clearSelection}
                disabled={isUploading}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{validationError}</p>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h5 className="font-medium text-gray-900 mb-2">Photo Guidelines</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use a high-quality image (JPEG, PNG, or WebP)</li>
          <li>• Square photos work best (1:1 aspect ratio)</li>
          <li>• Face should be clearly visible and centered</li>
          <li>• Professional attire recommended</li>
          <li>• Good lighting and neutral background</li>
          <li>• File size should be under 5MB</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfilePictureUploadSection;