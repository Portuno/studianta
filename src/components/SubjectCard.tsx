import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MoreVertical, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubjectCardProps {
  subject: {
    id: string;
    name: string;
    syllabus_file_name?: string | null;
  };
  onEdit: (subject: any) => void;
  onDelete: (subjectId: string) => void;
  onClick?: () => void;
}

export const SubjectCard = ({ subject, onEdit, onDelete, onClick }: SubjectCardProps) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setShowContextMenu(true);
    }
  };

  const handleLongPress = () => {
    // For mobile long press
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({
        x: rect.width / 2,
        y: rect.height / 2,
      });
      setShowContextMenu(true);
    }
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    onEdit(subject);
  };

  const handleDelete = () => {
    setShowContextMenu(false);
    onDelete(subject.id);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node) &&
        !cardRef.current?.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Long press timer for mobile
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      handleLongPress();
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      handleLongPress();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="relative" ref={cardRef}>
      <Card
        className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm"
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
        onMouseLeave={() => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-lavender-100 flex items-center justify-center">
              <span className="text-lavender-600 text-lg">📁</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{subject.name}</h3>
              {subject.syllabus_file_name && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{subject.syllabus_file_name}</span>
                </div>
              )}
            </div>
          </div>
          <MoreVertical size={16} className="text-gray-400" />
        </div>
      </Card>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit size={14} />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}; 