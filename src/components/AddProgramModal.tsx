import { useState, useRef } from "react";
import { X, Upload, FileText, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePrograms } from "@/hooks/useSupabase";

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramCreated: () => void;
}

export const AddProgramModal = ({ isOpen, onClose, onProgramCreated }: AddProgramModalProps) => {
  const { addProgram } = usePrograms();
  const [programName, setProgramName] = useState("");
  const [institution, setInstitution] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || 
          file.type === "application/msword" || 
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setSyllabusFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || 
          file.type === "application/msword" || 
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setSyllabusFile(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setSyllabusFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!programName.trim()) return;
    
    setIsUploading(true);
    
    try {
      // Create the program (top-level subject)
      const { data, error } = await addProgram({
        name: programName.trim(),
        institution: institution.trim() || null,
        color: getRandomPastelColor(),
        icon: getRandomIcon(),
      });

      if (error) {
        console.error('Error creating program:', error);
        return;
      }

      // TODO: Handle syllabus upload if file is present
      // This would be implemented when we add file processing for AI analysis
      
      // Reset form
      setProgramName("");
      setInstitution("");
      setSyllabusFile(null);
      
      // Close modal and refresh
      onProgramCreated();
      onClose();
      
    } catch (error) {
      console.error('Error creating program:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getRandomPastelColor = () => {
    const colors = [
      '#fce7f3', // pink-100
      '#f3e8ff', // purple-100
      '#ecfdf5', // green-100
      '#fef3c7', // yellow-100
      '#fce4ec', // pink-200
      '#e9d5ff', // purple-200
      '#d1fae5', // green-200
      '#fde68a', // yellow-200
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomIcon = () => {
    const icons = ['💻', '📚', '⚡', '🔬', '🏛️', '🎨', '🌍', '🧮'];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-medium text-gray-800">Add New Program</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {/* Program Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Program Name
            </label>
            <Input
              placeholder="e.g., Medicine, Computer Science"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="rounded-2xl border-pink-200 bg-white/80 focus:border-pink-300 focus:ring-pink-200"
              required
            />
          </div>

          {/* Institution Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Institution
            </label>
            <Input
              placeholder="e.g., University of Cambridge"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="rounded-2xl border-pink-200 bg-white/80 focus:border-pink-300 focus:ring-pink-200"
            />
          </div>

          {/* Syllabus Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Upload Program Syllabus <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-gray-500">
              This document (PDF or Word) will help the AI break down subjects and topics for the Plan tab
            </p>
            
            {/* Drag & Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-pink-400 bg-pink-50' 
                  : 'border-pink-200 hover:border-pink-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {syllabusFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-pink-600">
                    <FileText size={20} />
                    <span className="font-medium">{syllabusFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
                    <Upload size={24} className="text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your PDF here, or
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-pink-400 hover:bg-pink-500 text-white border-0 rounded-full px-6"
                    >
                      Choose PDF or Word File
                    </Button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              type="submit"
              disabled={!programName.trim() || isUploading}
              className="w-full bg-pink-400 hover:bg-pink-500 text-white rounded-full py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Creating Program...
                </>
              ) : (
                <>
                  <Plus size={20} className="mr-2" />
                  Create Program
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full py-3"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}; 