import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Download, AlertCircle, CheckCircle, Loader, Trash2 } from 'lucide-react';
import { uploadResume, deleteExistingResume, validateResumeFile, formatFileSize, getFileTypeIcon } from '../lib/resumeStorage';
import { useAuthContext } from './AuthProvider';

interface ResumeUploadSectionProps {
  currentResumeUrl?: string;
  currentResumeFileName?: string;
  currentResumeFileSize?: number;
  currentResumeUploadedAt?: string;
  onUploadSuccess?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  onDeleteSuccess?: () => void;
}

const ResumeUploadSection = ({
  currentResumeUrl,
  currentResumeFileName,
  currentResumeFileSize,
  currentResumeUploadedAt,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess
}: ResumeUploadSectionProps) => {
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setValidationError('');
    setSelectedFile(null);

    // Validate file
    const error = validateResumeFile(file);
    if (error) {
      setValidationError(error.message);
      return;
    }

    setSelectedFile(file);
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

      const result = await uploadResume(selectedFile, user.id);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        onUploadSuccess?.(result.url, result.fileName);
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

    const confirmed = window.confirm('Are you sure you want to delete your resume? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteExistingResume(user.id);
      onDeleteSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete resume';
      onUploadError?.(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (currentResumeUrl) {
      window.open(currentResumeUrl, '_blank');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Resume/CV</h4>
        <p className="text-sm text-gray-600 mb-4">
          Upload your resume in PDF, DOC, or DOCX format (max 5MB)
        </p>
      </div>

      {/* Current Resume Display */}
      {currentResumeUrl && currentResumeFileName && !selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getFileTypeIcon(currentResumeFileName)}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Resume uploaded</span>
                </div>
                <p className="text-sm text-green-700 mt-1">{currentResumeFileName}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-green-600">
                  {currentResumeFileSize && (
                    <span>Size: {formatFileSize(currentResumeFileSize)}</span>
                  )}
                  {currentResumeUploadedAt && (
                    <span>
                      Uploaded: {new Date(currentResumeUploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                title="Download resume"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                title="Delete resume"
              >
                {isDeleting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      {(!currentResumeUrl || selectedFile) && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : validationError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInputChange}
            className="hidden"
            id="resume-upload"
          />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-3xl">{getFileTypeIcon(selectedFile.name)}</div>
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
                  <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
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
                      <span>Upload Resume</span>
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
          ) : (
            <label htmlFor="resume-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium text-gray-700 mb-2">
                Drop your resume here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: PDF, DOC, DOCX (max 5MB)
              </p>
            </label>
          )}
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
        <h5 className="font-medium text-gray-900 mb-2">Resume Guidelines</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use a professional format (PDF recommended)</li>
          <li>• Include your contact information</li>
          <li>• Highlight relevant skills and experience</li>
          <li>• Keep it concise (1-2 pages)</li>
          <li>• Use clear, readable fonts</li>
          <li>• Proofread for spelling and grammar</li>
        </ul>
      </div>
    </div>
  );
};

export default ResumeUploadSection;