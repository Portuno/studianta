import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Plus, Upload, Clock, User, MapPin, Folder, ChevronDown, X } from "lucide-react";
import { FileStatusBadge } from "./FileStatusBadge";
import { Input } from "@/components/ui/input";
import { PDFViewer } from "./PDFViewer";
import { FolderItem } from "./FolderItem";
import { CreateFolderModal } from "./CreateFolderModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SubjectViewProps {
  subject: {
    id: string;
    name: string;
    syllabus_file_path?: string | null;
    syllabus_file_name?: string | null;
    syllabus_file_size?: number | null;
    instructor_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
  materials: any[];
  onAddFile: (opts?: { subjectId?: string; folderName?: string }) => void;
  onChatWithFolder?: (folderId: string, folderName: string, subjectId: string) => void;
}

interface SubjectEvent {
  id: string;
  name: string;
  event_type: string;
  event_date: string;
  description: string;
}

interface SubjectSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
}

interface Folder {
  id: string;
  name: string;
  subject_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  files: any[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'exam', label: 'Examen' },
  { value: 'practical_activity', label: 'Actividad Práctica' },
  { value: 'project_submission', label: 'Entrega de Proyecto' },
  { value: 'presentation', label: 'Presentación' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment_due', label: 'Tarea Pendiente' },
  { value: 'lab_session', label: 'Sesión de Laboratorio' },
  { value: 'other', label: 'Otro' }
];

const getEventTypeLabel = (t: string) => EVENT_TYPE_OPTIONS.find(o => o.value === t)?.label || 'Otro';

export const SubjectView = ({ subject, materials, onAddFile, onChatWithFolder }: SubjectViewProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'calendar'>('files');
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState<string>("");
  const [newEventType, setNewEventType] = useState<string>("other");
  const [newEventDescription, setNewEventDescription] = useState<string>("");
  
  // Real data from database
  const [events, setEvents] = useState<SubjectEvent[]>([]);
  const [schedules, setSchedules] = useState<SubjectSchedule[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch events, schedules, and folders for this subject
  useEffect(() => {
    if (subject?.id && user) {
      // Debug environment variables
      console.log('Environment variables:', {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        NODE_ENV: import.meta.env.MODE
      });
      
      fetchSubjectData();
    }
  }, [subject?.id, user]);

  // Cerrar menú cuando se haga clic fuera o se presione Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.add-menu-container')) {
        setShowAddMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddMenu(false);
      }
    };

    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAddMenu]);

  const fetchSubjectData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('subject_events')
        .select('*')
        .eq('subject_id', subject.id)
        .eq('user_id', user.id)
        .order('event_date');

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('subject_id', subject.id)
        .eq('user_id', user.id)
        .order('day_of_week, start_time');

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

      // Fetch folders with their associated files
      try {
        // First, get folders without the join
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('subject_id', subject.id)
          .eq('user_id', user.id)
          .order('created_at');

        if (foldersError) {
          console.error('Error fetching folders:', foldersError);
          setFolders([]);
        } else {
          // Now get files for each folder separately
          const foldersWithFiles = await Promise.all(
            (foldersData || []).map(async (folder) => {
              const { data: filesData } = await supabase
                .from('study_materials')
                .select('id, title, type, file_path, file_size, mime_type, created_at')
                .eq('folder_id', folder.id)
                .eq('user_id', user.id);

              return {
                ...folder,
                files: filesData || []
              };
            })
          );

          setFolders(foldersWithFiles);
        }
      } catch (error) {
        console.error('Fatal error fetching folders:', error);
        setFolders([]);
      }

    } catch (error) {
      console.error('Error fetching subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText size={20} className="text-red-500" />;
      case 'image':
        return <span className="text-2xl">🖼️</span>;
      case 'video':
        return <span className="text-2xl">🎥</span>;
      case 'audio':
        return <span className="text-2xl">🎵</span>;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf" || 
        file.type === "application/msword" || 
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "text/plain" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type.startsWith("image/")) {
      setSelectedFile(file);
    } else {
      alert('Por favor selecciona un tipo de archivo compatible: PDF, Word, Excel, Texto o archivos de imagen.');
    }
  };

  const handleFileUpload = async () => {
    if (!fileName.trim() || !selectedFile) {
      alert('Por favor proporciona un nombre de archivo y selecciona un archivo.');
      return;
    }

    setIsUploading(true);
    try {
      // Call the onAddFile function passed from parent
      onAddFile();
      
      // Reset form
      setFileName("");
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Por favor, inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyllabusClick = () => {
    if (subject.syllabus_file_path) {
      // Debug the file path and URL construction
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkbgryajkejgvmswglah.supabase.co';
      const fullUrl = `${baseUrl}/storage/v1/object/public/study-materials/${subject.syllabus_file_path}`;
      
      console.log('Syllabus click debug:', {
        syllabus_file_path: subject.syllabus_file_path,
        baseUrl: baseUrl,
        fullUrl: fullUrl,
        subject: subject
      });
      
      setShowPDFViewer(true);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          subject_id: subject.id,
          name: folderName
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add files array to match the interface
      const newFolder: Folder = {
        ...data,
        files: []
      };
      
      setFolders([...folders, newFolder]);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(`Error al crear la carpeta: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleEditFolder = async (folderId: string, newName: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFolders(folders.map(folder => 
        folder.id === folderId ? { ...folder, name: newName } : folder
      ));
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('Error al actualizar la carpeta. Por favor, inténtalo de nuevo.');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFolders(folders.filter(folder => folder.id !== folderId));
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Error al eliminar la carpeta. Por favor, inténtalo de nuevo.');
    }
  };

  const handleAddFileToFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    const folder = folders.find(f => f.id === folderId);
    const folderName = folder?.name;
    onAddFile({ subjectId: subject.id, folderName });
    console.log('Add file to folder:', folderId);
  };

  const handleFileClick = (file: any) => {
    if (file.type === 'pdf' || file.file_path?.endsWith('.pdf')) {
      setShowPDFViewer(true);
    } else {
      // Handle other file types (download, preview, etc.)
      console.log('File clicked:', file);
    }
  };

  const handleChatWithFolder = (folderId: string, folderName: string, subjectId: string) => {
    if (onChatWithFolder) {
      onChatWithFolder(folderId, folderName, subjectId);
    }
  };

  const handleAddEvent = () => {
    // abrir modal, sin insertar
    setNewEventName("");
    setNewEventDescription("");
    setNewEventType("other");
    setNewEventDate("");
    setShowAddEventModal(true);
    
    // Debug: Log the initial values
    console.log('Modal opened with newEventType:', "other");
  };

  const handleUpdateEvent = async (id: string, field: keyof SubjectEvent, value: string) => {
    try {
      const { error } = await supabase
        .from('subject_events')
        .update({ [field]: value })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setEvents(events.map(event => 
        event.id === id ? { ...event, [field]: value } : event
      ));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleRemoveEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subject_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const handleAddSchedule = async () => {
    if (!user) return;
    
    const newSchedule = {
      day_of_week: 1, // Monday default
      start_time: "09:00",
      end_time: "10:00",
      location: "",
      description: ""
    };

    try {
      const { data, error } = await supabase
        .from('subject_schedules')
        .insert({
          user_id: user.id,
          subject_id: subject.id,
          ...newSchedule
        })
        .select()
        .single();

      if (error) throw error;
      setSchedules([...schedules, data]);
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('Error al agregar el horario. Por favor, inténtalo de nuevo.');
    }
  };

  const handleUpdateSchedule = async (id: string, field: keyof SubjectSchedule, value: string | number) => {
    try {
      const { error } = await supabase
        .from('subject_schedules')
        .update({ [field]: value })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setSchedules(schedules.map(schedule => 
        schedule.id === id ? { ...schedule, [field]: value } : schedule
      ));
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleRemoveSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subject_schedules')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      setSchedules(schedules.filter(schedule => schedule.id !== id));
    } catch (error) {
      console.error('Error removing schedule:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center w-full bg-gray-100 rounded-xl p-1 relative overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative z-10 ${
            activeTab === 'files' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'
          }`}
          aria-label="Archivos"
        >
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">📂</span>
            <span>Archivos</span>
          </div>
        </button>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2 z-0"></div>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative z-10 ${
            activeTab === 'calendar' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'
          }`}
          aria-label="Calendario"
        >
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">🗓️</span>
            <span>Calendario</span>
          </div>
        </button>
        <div 
          className={`absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-200 z-0 ${
            activeTab === 'files' ? 'left-1 right-1/2' : 'left-1/2 right-1'
          }`}
        ></div>
      </div>

      {/* Files Tab Content */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          {/* Syllabus Section */}
          {subject.syllabus_file_path && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Programa del Curso
              </h3>
              <Card 
                className="p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                onClick={handleSyllabusClick}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-600">
                      Programa del curso y descripción general
                      {subject.instructor_name && `, ${subject.instructor_name}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-300 text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkbgryajkejgvmswglah.supabase.co';
                        const fullUrl = `${baseUrl}/storage/v1/object/public/study-materials/${subject.syllabus_file_path}`;
                        console.log('Debug URL:', fullUrl);
                        console.log('File path:', subject.syllabus_file_path);
                        alert(`Ruta del archivo: ${subject.syllabus_file_path}\nURL completa: ${fullUrl}`);
                      }}
                    >
                      Debug
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Folders Section */}
          <div className="space-y-3">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📁</span>
                Carpetas
              </h3>
            </div>

            {folders.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Folder size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Aún no hay carpetas</h3>
                <p className="text-gray-500 mb-4">Crea carpetas para organizar tus materiales de estudio</p>
                <Button 
                  onClick={() => setShowCreateFolder(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6"
                >
                  <Plus size={16} className="mr-2" />
                  Crear Primera Carpeta
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {folders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onAddFile={handleAddFileToFolder}
                    onEditFolder={handleEditFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onFileClick={handleFileClick}
                    onChatWithFolder={handleChatWithFolder}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Loose Files Section - Only show materials that are NOT in any folder */}
          {materials.filter(m => !folders.some(f => f.files.some(file => file.id === m.id))).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📄</span>
                Otros Archivos
              </h3>
              <div className="space-y-2">
                {materials.filter(m => !folders.some(f => f.files.some(file => file.id === m.id))).map((material) => (
                  <Card 
                    key={material.id} 
                    className="p-4 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFileClick(material)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getFileIcon(material.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{material.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {material.file_size && (
                            <>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(material.file_size)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                            </>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(material.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileStatusBadge status="completed" size="sm" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab Content */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Key Dates & Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Fechas y Eventos Clave
              </h3>
              <Button
                onClick={handleAddEvent}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2"
              >
                <Plus size={16} className="mr-2" />
                Agregar Evento
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No hay eventos programados</h3>
                <p className="text-gray-500">Agrega fechas importantes y fechas límite para esta asignatura</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4 rounded-xl border border-red-200 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {getEventTypeLabel(event.event_type)}
                          </span>
                          <span className="text-sm text-red-600 font-medium">
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                        </div>
                        <Input
                          value={event.name}
                          onChange={(e) => handleUpdateEvent(event.id, 'name', e.target.value)}
                          className="border-red-200 bg-white mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input
                            type="date"
                            value={event.event_date}
                            onChange={(e) => handleUpdateEvent(event.id, 'event_date', e.target.value)}
                            className="border-red-200 bg-white"
                          />
                          <select
                            value={event.event_type}
                            onChange={(e) => handleUpdateEvent(event.id, 'event_type', e.target.value)}
                            className="rounded-md border border-red-200 px-3 py-2 text-sm bg-white"
                          >
                            {EVENT_TYPE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <Input
                          value={event.description || ''}
                          onChange={(e) => handleUpdateEvent(event.id, 'description', e.target.value)}
                          placeholder="Descripción (opcional)"
                          className="border-red-200 bg-white"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEvent(event.id)}
                        className="text-red-700 border-red-300 hover:bg-red-50 ml-4"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Class Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Horario de Clases
              </h3>
              <Button
                onClick={handleAddSchedule}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2"
              >
                <Plus size={16} className="mr-2" />
                Agregar Horario
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando horarios...</p>
              </div>
            ) : schedules.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No hay horario establecido</h3>
                <p className="text-gray-500">Agrega horarios de clase y ubicaciones para esta asignatura</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4 rounded-xl border border-green-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs text-green-700 mb-1">Día</label>
                            <select
                              value={schedule.day_of_week}
                              onChange={(e) => handleUpdateSchedule(schedule.id, 'day_of_week', parseInt(e.target.value))}
                              className="w-full rounded border-green-300 px-2 py-1 text-sm focus:border-green-500 focus:ring-green-100"
                            >
                              {DAYS_OF_WEEK.map(day => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-green-700 mb-1">Hora</label>
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={schedule.start_time}
                                onChange={(e) => handleUpdateSchedule(schedule.id, 'start_time', e.target.value)}
                                className="w-full rounded border-green-300 px-2 py-1 text-sm focus:border-green-500 focus:ring-green-100"
                              />
                              <span className="text-green-600 self-center">-</span>
                              <input
                                type="time"
                                value={schedule.end_time}
                                onChange={(e) => handleUpdateSchedule(schedule.id, 'end_time', e.target.value)}
                                className="w-full rounded border-green-300 px-2 py-1 text-sm focus:border-green-500 focus:ring-green-100"
                              />
                            </div>
                          </div>
                        </div>
                        <Input
                          value={schedule.location || ''}
                          onChange={(e) => handleUpdateSchedule(schedule.id, 'location', e.target.value)}
                          placeholder="Ubicación (opcional)"
                          className="border-green-300 bg-white mb-2"
                        />
                        <Input
                          value={schedule.description || ''}
                          onChange={(e) => handleUpdateSchedule(schedule.id, 'description', e.target.value)}
                          placeholder="Descripción (opcional)"
                          className="border-green-300 bg-white"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSchedule(schedule.id)}
                        className="text-green-700 border-green-300 hover:bg-green-50 ml-4"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && subject.syllabus_file_path && (
        <PDFViewer
          fileUrl={`${import.meta.env.VITE_SUPABASE_URL || 'https://hkbgryajkejgvmswglah.supabase.co'}/storage/v1/object/public/study-materials/${subject.syllabus_file_path}`}
          fileName={subject.syllabus_file_name || 'Programa de Estudios'}
          onClose={() => setShowPDFViewer(false)}
        />
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Evento</h3>
              <button onClick={() => setShowAddEventModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <Input placeholder="Nombre del evento" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
                  {EVENT_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <Input placeholder="Descripción (opcional)" value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} />
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowAddEventModal(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (!user || !newEventName.trim() || !newEventDate) return;
                  
                  // Debug: Log the values being sent
                  console.log('Creating event with values:', {
                    user_id: user.id,
                    subject_id: subject.id,
                    name: newEventName.trim(),
                    event_type: newEventType,
                    event_date: newEventDate,
                    description: newEventDescription || null
                  });
                  
                  // Additional debug: Check if newEventType is valid
                  const isValidEventType = EVENT_TYPE_OPTIONS.some(opt => opt.value === newEventType);
                  console.log('Event type validation:', { newEventType, isValidEventType, validOptions: EVENT_TYPE_OPTIONS.map(o => o.value) });
                  
                  try {
                    const { data, error } = await supabase
                      .from('subject_events')
                      .insert({
                        user_id: user.id,
                        subject_id: subject.id,
                        name: newEventName.trim(),
                        event_type: newEventType,
                        event_date: newEventDate,
                        description: newEventDescription || null
                      })
                      .select()
                      .single();
                    if (error) throw error;
                    setEvents(prev => [...prev, data]);
                    setShowAddEventModal(false);
                    setNewEventName(""); setNewEventDate(""); setNewEventType("other"); setNewEventDescription("");
                  } catch (e) {
                    console.error('Error adding event:', e);
                    alert('No se pudo crear el evento. Verifica la fecha e intenta nuevamente.');
                  }
                }}
                disabled={!newEventName.trim() || !newEventDate}
              >
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button - Add File/Folder */}
      <div className="fixed bottom-24 right-6 z-50 md:hidden">
        <div className="relative add-menu-container">
          {/* Botón rosa principal */}
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-16 h-16 bg-pink-400 hover:bg-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center relative"
            title="Agregar Archivo o Carpeta"
          >
            <Plus size={28} />
            <ChevronDown 
              size={14} 
              className={`absolute bottom-1 right-1 transition-transform duration-200 ${showAddMenu ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {/* Menú desplegable */}
          {showAddMenu && (
            <div className="absolute right-0 bottom-20 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => {
                  onAddFile({ subjectId: subject.id });
                  setShowAddMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors flex items-center gap-3 rounded-lg mx-2"
              >
                <Upload size={18} className="text-pink-500" />
                <span className="text-gray-700 font-medium">Agregar Archivo</span>
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(true);
                  setShowAddMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 rounded-lg mx-2"
              >
                <Folder size={18} className="text-blue-500" />
                <span className="text-gray-700 font-medium">Crear Carpeta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 