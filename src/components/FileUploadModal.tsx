import { useState, useCallback, useEffect } from 'react';
import { X, Upload, FileText, Image, Video, Headphones, File, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSupabase';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  preselectedSubjectId?: string;
  defaultTopicName?: string;
  isTopicOptional?: boolean;
}

interface FileWithPreview {
  file: File;
  preview: string;
  type: 'pdf' | 'audio' | 'video' | 'image' | 'document';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const getFileType = (file: File): 'pdf' | 'audio' | 'video' | 'image' | 'document' => {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText size={20} className="text-red-400" />;
    case 'audio': return <Headphones size={20} className="text-blue-400" />;
    case 'video': return <Video size={20} className="text-purple-400" />;
    case 'image': return <Image size={20} className="text-green-400" />;
    default: return <File size={20} className="text-gray-400" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileUploadModal = ({ isOpen, onClose, onUploadComplete, preselectedSubjectId, defaultTopicName, isTopicOptional = false }: FileUploadModalProps) => {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(preselectedSubjectId || '');
  const [topicName, setTopicName] = useState(defaultTopicName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setSelectedSubject(preselectedSubjectId || '');
    setTopicName(defaultTopicName || '');
  }, [preselectedSubjectId, defaultTopicName]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const filesWithPreview: FileWithPreview[] = newFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      type: getFileType(file),
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...filesWithPreview]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (fileWithPreview: FileWithPreview, index: number): Promise<string> => {
    const { file } = fileWithPreview;
    const fileExt = file.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const sanitizedSubject = selectedSubject || 'unknown-subject';
    const sanitizedTopic = (topicName || '').trim();
    const filePath = sanitizedTopic
      ? `${user?.id}/${sanitizedSubject}/${sanitizedTopic}/${uniqueName}`
      : `${user?.id}/${sanitizedSubject}/${uniqueName}`;

    const { data, error } = await supabase.storage
      .from('study-materials')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;
    return data.path;
  };

  const handleUpload = async () => {
    if (!selectedSubject || files.length === 0) return;
    if (!isTopicOptional && !topicName) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const fileWithPreview = files[i];
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading', progress: 0 } : f));

        try {
          for (let progress = 0; progress <= 100; progress += 10) {
            setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress } : f));
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const filePath = await uploadFile(fileWithPreview, i);

          const { error: dbError } = await supabase
            .from('study_materials')
            .insert({
              user_id: user?.id as string,
              subject_id: selectedSubject,
              title: fileWithPreview.file.name,
              type: fileWithPreview.type,
              file_path: filePath,
              file_size: fileWithPreview.file.size,
              mime_type: fileWithPreview.file.type,
              content: null,
            });

          if (dbError) throw dbError;

          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed', progress: 100 } : f));
        } catch (error: any) {
          console.error('Error uploading file:', error);
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: error.message } : f));
        }
      }

      onUploadComplete();

      setTimeout(() => {
        onClose();
        setFiles([]);
        setSelectedSubject(preselectedSubjectId || '');
        setTopicName(defaultTopicName || '');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Upload Files</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Subject and Topic Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              {preselectedSubjectId ? (
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {subjects.find(s => s.id === preselectedSubjectId)?.name || 'Selected Subject'}
                </div>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-300"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isTopicOptional ? 'Folder (optional)' : 'Topic Name'}
              </label>
              <Input
                type="text"
                placeholder={isTopicOptional ? 'Leave empty to upload at subject root' : 'Enter topic name'}
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="border-gray-200 focus:ring-pink-200 focus:border-pink-300"
              />
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
              ${dragActive 
                ? 'border-pink-400 bg-pink-50' 
                : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={32} className="mx-auto mb-4 text-pink-400" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-500 mb-4">
              Support for PDF, images, audio, and video files
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi,.mov"
            />
            <label
              htmlFor="file-input"
              className="inline-flex items-center px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 cursor-pointer transition-colors"
            >
              Choose Files
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700">Selected Files</h3>
              {files.map((fileWithPreview, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(fileWithPreview.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {fileWithPreview.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileWithPreview.file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Progress Bar */}
                    {fileWithPreview.status === 'uploading' && (
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-400 transition-all duration-300"
                          style={{ width: `${fileWithPreview.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Status Icon */}
                    {fileWithPreview.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full bg-gray-300" />
                    )}
                    {fileWithPreview.status === 'uploading' && (
                      <Loader2 size={16} className="text-pink-400 animate-spin" />
                    )}
                    {fileWithPreview.status === 'completed' && (
                      <CheckCircle2 size={16} className="text-green-500" />
                    )}
                    {fileWithPreview.status === 'error' && (
                      <div className="w-4 h-4 rounded-full bg-red-400" />
                    )}
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!selectedSubject || files.length === 0 || (!isTopicOptional && !topicName) || isUploading} className="bg-pink-400 hover:bg-pink-500 text-white">
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};