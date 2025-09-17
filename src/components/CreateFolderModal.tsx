import { useState, useEffect } from "react";
import { X, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folderName: string) => void;
}

export const CreateFolderModal = ({ isOpen, onClose, onCreateFolder }: CreateFolderModalProps) => {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent modal from closing when switching tabs
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (folderName.trim() && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir? Se perderán los cambios no guardados.';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      // Don't close modal when tab becomes hidden/visible
      // This prevents the modal from closing when switching tabs
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, folderName, isSubmitting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsSubmitting(true);
    try {
      onCreateFolder(folderName.trim());
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFolderName("");
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Folder size={20} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-light text-gray-800">Crear Carpeta</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Nombre de la Carpeta *
            </label>
            <Input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="ej., Derecho Constitucional, Casos de Derechos Civiles, Teoría Legal"
              className="w-full rounded-xl border-gray-300 focus:border-blue-400 focus:ring-blue-100 bg-white"
              disabled={isSubmitting}
              autoFocus
              aria-label="Nombre de la Carpeta"
            />
            <p className="text-xs text-gray-500 mt-2">
              Las carpetas te ayudan a organizar tus materiales de estudio por temas o conceptos específicos.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full px-6 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!folderName.trim() || isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 font-medium"
            aria-disabled={!folderName.trim()}
          >
            {isSubmitting ? 'Creando...' : 'Crear Carpeta'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 