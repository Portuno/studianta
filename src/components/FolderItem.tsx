import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface FolderItemProps {
  folder: {
    id: string;
    name: string;
    files: any[];
  };
  onAddFile: (folderId: string) => void;
  onEditFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onFileClick: (file: any) => void;
}

export const FolderItem = ({ 
  folder, 
  onAddFile, 
  onEditFolder, 
  onDeleteFolder, 
  onFileClick 
}: FolderItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleEdit = () => {
    setIsEditing(true);
    setEditName(folder.name);
  };

  const handleSave = () => {
    if (editName.trim() && editName !== folder.name) {
      onEditFolder(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(folder.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the folder "${folder.name}" and all its files?`)) {
      onDeleteFolder(folder.id);
    }
  };

  return (
    <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm">
      {/* Folder Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={20} className="text-gray-600" />
              ) : (
                <ChevronRight size={20} className="text-gray-600" />
              )}
            </button>
            
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Folder size={20} className="text-blue-600" />
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <Button size="sm" onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{folder.name}</h3>
                <p className="text-sm text-gray-500">
                  {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddFile(folder.id)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Plus size={16} className="mr-1" />
                Add File
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Edit2 size={16} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Folder Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {folder.files.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No files in this folder</p>
              <Button
                size="sm"
                onClick={() => onAddFile(folder.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus size={16} className="mr-1" />
                Add First File
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {folder.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer"
                  onClick={() => onFileClick(file)}
                >
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                    <FileText size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.title}</p>
                    <p className="text-xs text-gray-500">
                      {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}; 