import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronRight, MoreVertical, MessageCircle } from "lucide-react";

interface FolderItemProps {
  folder: {
    id: string;
    name: string;
    files: any[];
    subject_id: string;
  };
  onAddFile: (folderId: string) => void;
  onEditFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onFileClick: (file: any) => void;
  onChatWithFolder: (folderId: string, folderName: string, subjectId: string) => void;
}

export const FolderItem = ({ 
  folder, 
  onAddFile, 
  onEditFolder, 
  onDeleteFolder, 
  onFileClick,
  onChatWithFolder
}: FolderItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);

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
    setShowContextMenu(false);
    
    // Crear una alerta personalizada más linda
    const deleteMessage = `🗑️ ¿Eliminar carpeta?\n\n"${folder.name}"\n\n${folder.files.length > 0 ? `Esta carpeta contiene ${folder.files.length} archivo${folder.files.length !== 1 ? 's' : ''} que también se eliminarán.` : 'Esta carpeta está vacía.'}\n\nEsta acción no se puede deshacer.`;
    
    if (confirm(deleteMessage)) {
      onDeleteFolder(folder.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
  };

  const handleEditFromMenu = () => {
    setShowContextMenu(false);
    handleEdit();
  };

  const handleAddFileFromMenu = () => {
    setShowContextMenu(false);
    onAddFile(folder.id);
  };

  const handleChatWithFolder = () => {
    setShowContextMenu(false);
    onChatWithFolder(folder.id, folder.name, folder.subject_id);
  };

  // Cerrar menú contextual al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  return (
    <>
      <Card 
        className="border border-gray-200 bg-white/90 backdrop-blur-sm hover:border-pink-200 transition-colors cursor-pointer"
        onContextMenu={handleContextMenu}
      >
        {/* Folder Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-pink-100 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={20} className="text-pink-600" />
                ) : (
                  <ChevronRight size={20} className="text-pink-600" />
                )}
              </button>
              
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Folder size={20} className="text-pink-600" />
              </div>
              
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border-pink-200 focus:border-pink-400 focus:ring-pink-100"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                  <Button size="sm" onClick={handleSave} className="bg-pink-500 hover:bg-pink-600 text-white">
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="border-pink-300 text-pink-700">
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{folder.name}</h3>
                  <p className="text-sm text-gray-500">
                    {folder.files.length} archivo{folder.files.length !== 1 ? 's' : ''}
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
                  className="border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <Plus size={16} className="mr-1" />
                  Agregar Archivo
                </Button>
                <button
                  onClick={handleContextMenu}
                  className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
                  title="Más opciones"
                >
                  <MoreVertical size={16} className="text-pink-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Folder Content */}
        {isExpanded && (
          <div className="border-t border-pink-100 bg-pink-50/30">
            {folder.files.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <FileText size={20} className="text-pink-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No hay archivos en esta carpeta</p>
                <Button
                  size="sm"
                  onClick={() => onAddFile(folder.id)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Plus size={16} className="mr-1" />
                  Agregar Primer Archivo
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {folder.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pink-100 hover:border-pink-200 transition-colors cursor-pointer"
                    onClick={() => onFileClick(file)}
                  >
                    <div className="w-8 h-8 rounded bg-pink-100 flex items-center justify-center">
                      <FileText size={16} className="text-pink-600" />
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

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-pink-200 py-2 min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -10px)'
          }}
        >
          <button
            onClick={handleAddFileFromMenu}
            className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors flex items-center gap-3 text-gray-700"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
              <Plus size={16} className="text-pink-600" />
            </div>
            <span className="font-medium">Agregar Archivo</span>
          </button>
          
          <button
            onClick={handleEditFromMenu}
            className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors flex items-center gap-3 text-gray-700"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
              <Edit2 size={16} className="text-pink-600" />
            </div>
            <span className="font-medium">Editar Nombre</span>
          </button>
          
          <button
            onClick={handleChatWithFolder}
            className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3 text-purple-700"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageCircle size={16} className="text-purple-600" />
            </div>
            <span className="font-medium">💬 Chatear!</span>
          </button>
          
          <div className="border-t border-pink-100 my-1"></div>
          
          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <span className="font-medium">Eliminar Carpeta</span>
          </button>
        </div>
      )}
    </>
  );
}; 