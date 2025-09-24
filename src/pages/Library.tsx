import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Folder, 
  FileText, 
  Headphones, 
  Video, 
  Image, 
  Plus, 
  Loader2, 
  ChevronRight,
  Upload,
  AlertCircle,
  GraduationCap,
  ChevronDown,
  BookOpen,
  MoreVertical,
  StickyNote,
  Save,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePrograms } from "@/hooks/useSupabase";
import { useSubjects } from "@/hooks/useSupabase";
// import { useTopics } from "@/hooks/useSupabase"; // REMOVIDO: useTopics fue eliminado
import { useStudyMaterials } from "@/hooks/useSupabase";
import { useNotes } from "@/hooks/useSupabase";
import { FileStatusBadge } from "@/components/FileStatusBadge";
import { FileUploadModal } from "@/components/FileUploadModal";
import { AddProgramModal } from "@/components/AddProgramModal";
import { AddSubjectModal } from "@/components/AddSubjectModal";
import { EditSubjectModal } from "@/components/EditSubjectModal";
import { SubjectCard } from "@/components/SubjectCard";
import { SubjectView } from "@/components/SubjectView";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useWeeklyGoals } from "@/hooks/useSupabase";
import { useIsMobile } from "@/hooks/use-mobile";

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText size={16} className="text-red-400" />;
    case 'audio': return <Headphones size={16} className="text-blue-400" />;
    case 'video': return <Video size={16} className="text-purple-400" />;
    case 'image': return <Image size={16} className="text-green-400" />;
    default: return <FileText size={16} className="text-gray-400" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { programs, loading: programsLoading, error: programsError } = usePrograms();
  const { subjects, loading: subjectsLoading, error: subjectsError, fetchSubjects } = useSubjects();
  const { materials, loading: materialsLoading, error: materialsError, fetchMaterials } = useStudyMaterials();
  const { goals: weeklyGoals, loading: weeklyGoalsLoading, error: weeklyGoalsError, fetchGoals: fetchWeeklyGoals } = useWeeklyGoals();
  const { addNote } = useNotes();
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [uploadContext, setUploadContext] = useState<{ subjectId?: string; folderName?: string } | null>(null);
  
  // Quick note creation state
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNoteSubject, setQuickNoteSubject] = useState<string>("");
  const [quickNoteName, setQuickNoteName] = useState("");
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const loading = programsLoading || subjectsLoading || materialsLoading || weeklyGoalsLoading;
  const hasError = programsError || subjectsError || materialsError || weeklyGoalsError;

  // Set default program when programs load
  useEffect(() => {
    if (programs.length > 0 && !selectedProgram) {
      // Try to restore last visited program from localStorage
      const lastProgramId = localStorage.getItem('lastProgramId');
      const lastProgram = programs.find(p => p.id === lastProgramId);
      
      if (lastProgram) {
        setSelectedProgram(lastProgram);
      } else {
        // Fallback to first program
        setSelectedProgram(programs[0]);
      }
    }
  }, [programs, selectedProgram]);

  // Save selected program to localStorage when it changes
  useEffect(() => {
    if (selectedProgram?.id) {
      localStorage.setItem('lastProgramId', selectedProgram.id);
    }
  }, [selectedProgram?.id]);

  // Fetch subjects when program changes
  useEffect(() => {
    if (selectedProgram?.id) {
      fetchSubjects(selectedProgram.id);
      setSelectedSubject(null);
    }
  }, [selectedProgram?.id]);

  // Fetch materials when subject changes
  useEffect(() => {
    if (selectedSubject?.id) {
      fetchMaterials(selectedSubject.id);
    }
  }, [selectedSubject?.id]);

  const handleSubjectSelect = (subject: any) => {
    setSelectedSubject(subject);
  };

  const handleAddSubject = () => {
    setShowAddSubject(true);
  };

  const handleAddTopic = () => {
    // This function is no longer needed since we removed topics
    console.log('Topics functionality removed');
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setShowEditSubject(true);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta asignatura? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', subjectId)
          .eq('user_id', user?.id);

        if (error) throw error;

        // Refresh subjects list
        if (selectedProgram?.id) {
          fetchSubjects(selectedProgram.id);
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Error al eliminar la asignatura. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleAddFile = (opts?: { subjectId?: string; folderName?: string }) => {
    setUploadContext(opts || null);
    setShowUpload(true);
  };

  const handleChatWithFolder = (folderId: string, folderName: string, subjectId: string) => {
    // Navegar al chat con parámetros de la carpeta
    navigate(`/chat?folderId=${folderId}&folderName=${encodeURIComponent(folderName)}&subjectId=${subjectId}`);
  };

  const handleViewNotes = (subjectId: string) => {
    // Navegar a notas con la asignatura preseleccionada
    navigate(`/notas?subject=${subjectId}`);
  };

  const handleAddProgram = () => {
    setShowAddProgram(true);
  };

  const handleUploadComplete = () => {
    // Refresh data after upload
    if (selectedSubject?.id) {
      fetchMaterials(selectedSubject.id);
    } else {
      fetchMaterials();
    }
  };

  const handleProgramCreated = () => {
    // Refresh subjects and set the new program as selected
    // The subjects will be refreshed automatically by the hook
    // We'll set the new program as selected when it loads
    setShowAddProgram(false);
  };

  const handleCreateQuickNote = async () => {
    if (!quickNoteSubject || !quickNoteName.trim()) {
      alert('Por favor selecciona una asignatura y escribe un nombre para la nota');
      return;
    }

    setIsSavingNote(true);
    try {
      const { error } = await addNote({
        subject_id: quickNoteSubject,
        name: quickNoteName,
        content: quickNoteContent
      });

      if (error) {
        throw error;
      }

      // Reset form
      setQuickNoteSubject("");
      setQuickNoteName("");
      setQuickNoteContent("");
      setShowQuickNote(false);
      
      // Show success message
      alert('Nota creada exitosamente');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error al crear la nota. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelQuickNote = () => {
    setQuickNoteSubject("");
    setQuickNoteName("");
    setQuickNoteContent("");
    setShowQuickNote(false);
  };


  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-lavender-50">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">Error al Cargar la Biblioteca</h2>
          <p className="text-gray-600 mb-4">Hubo un problema al cargar los datos de tu biblioteca.</p>
          <div className="text-sm text-gray-500 space-y-1">
            {programsError && <p>Programas: {programsError.message}</p>}
            {subjectsError && <p>Asignaturas: {subjectsError.message}</p>}
            {materialsError && <p>Materiales: {materialsError.message}</p>}
            {weeklyGoalsError && <p>Metas Semanales: {weeklyGoalsError.message}</p>}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-pink-400 hover:bg-pink-500"
          >
            Intentar de Nuevo
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-lavender-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-400" />
          <p className="text-gray-600">Cargando tu biblioteca...</p>
        </div>
      </div>
    );
  }

  // SCENARIO 1: Empty State (No Programs Added)
  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-lavender-50 pb-20 md:pb-6">
        {/* Header */}
        <div className="pt-12 md:pt-6 pb-6 px-6">
          <h1 className="text-2xl font-light text-gray-800 md:text-left text-center">Biblioteca</h1>
        </div>

        {/* Central Area - Empty State */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            {/* Large Friendly Icon */}
            <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-6">
              <GraduationCap size={48} className="text-pink-400" />
            </div>
            
            {/* Simple Message */}
            <h2 className="text-xl font-medium text-gray-700 mb-3">
              Aún no has agregado ningún programa
            </h2>
            
            {/* Call-to-Action Button */}
            <Button 
              onClick={handleAddProgram}
              className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={20} className="mr-2" />
              Agregar Programa
            </Button>
          </div>
        </div>

        {/* Add Program Modal */}
        <AddProgramModal
          isOpen={showAddProgram}
          onClose={() => setShowAddProgram(false)}
          onProgramCreated={handleProgramCreated}
        />
      </div>
    );
  }

  // SCENARIO 2: Populated State (With Programs Added)
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-lavender-50 pb-20 md:pb-6">
      {/* Header - Dynamic Program Name */}
      <div className="pt-12 md:pt-6 pb-6 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-light text-gray-800">{selectedProgram ? selectedProgram.name : 'Biblioteca'}</h1>
              {/* Always show program selector if there are programs */}
              {programs.length > 0 && (
                <button
                  onClick={() => setShowProgramSelector(!showProgramSelector)}
                  className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200 border border-pink-200"
                  title="Cambiar Programa"
                >
                  <ChevronDown size={18} className="text-pink-400" />
                </button>
              )}
            </div>
            {programs.length > 1 && (
              <span className="text-xs text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
                {programs.length} programas
              </span>
            )}
          </div>
          
        </div>

        {/* Program Selector Dropdown */}
        {showProgramSelector && programs.length > 0 && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
            <Card className="rounded-2xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <div className="p-2">
                <div className="p-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-600">Seleccionar Programa</p>
                </div>
                
                {/* Existing Programs */}
                {programs.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowProgramSelector(false);
                    }}
                    className={`w-full p-3 rounded-xl hover:bg-pink-50 transition-colors text-left flex items-center gap-3 ${
                      selectedProgram?.id === program.id ? 'bg-pink-50 border border-pink-200' : ''
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-pink-100"
                    >
                      📚
                    </div>
                    <span className="font-medium text-gray-800">{program.name}</span>
                    {selectedProgram?.id === program.id && (
                      <span className="ml-auto text-pink-500">✓</span>
                    )}
                  </button>
                ))}
                
                {/* Divider */}
                <div className="my-2 border-t border-gray-100"></div>
                
                {/* Add New Program Option */}
                <button
                  onClick={() => {
                    setShowAddProgram(true);
                    setShowProgramSelector(false);
                  }}
                  className="w-full p-3 rounded-xl hover:bg-green-50 transition-colors text-left flex items-center gap-3 border border-green-200 bg-green-50/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Plus size={20} className="text-green-600" />
                  </div>
                  <span className="font-medium text-green-700">Agregar Nuevo Programa</span>
                </button>
              </div>
            </Card>
          </div>
        )}
        
      </div>

      {/* Content Area */}
      <div className="px-6">
        {/* Breadcrumb */}
        {selectedSubject && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <button
              onClick={() => setSelectedSubject(null)}
              className="hover:text-pink-400 transition-colors"
            >
              {selectedProgram?.name || 'Biblioteca'}
            </button>
            <ChevronRight size={14} />
            <span className="text-pink-400">{selectedSubject.name}</span>
          </div>
        )}

        {/* Subjects View - list subjects for selected program */}
        {!selectedSubject && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Asignaturas</h2>
            {subjects.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-lavender-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={24} className="text-lavender-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Aún no hay asignaturas</h3>
                <p className="text-gray-500 mb-4">Crea tu primera asignatura para organizar tus archivos</p>
                <Button 
                  onClick={handleAddSubject}
                  className="bg-lavender-400 hover:bg-lavender-500 text-white rounded-full px-6"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Asignatura
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">
                    {subjects.length} asignatura{subjects.length !== 1 ? 's' : ''}
                  </h3>
                  <Button 
                    onClick={handleAddSubject}
                    size="sm"
                    className="bg-lavender-400 hover:bg-lavender-500 text-white rounded-full px-4 py-2"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="min-w-0">
                      <SubjectCard
                        subject={subject}
                        onEdit={handleEditSubject}
                        onDelete={handleDeleteSubject}
                        onClick={() => setSelectedSubject(subject)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Note Creation Section - Only show when not in subject view and there are subjects */}
        {!selectedSubject && subjects.length > 0 && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-700">Crear Nota Rápida</h2>
              <Button
                onClick={() => setShowQuickNote(!showQuickNote)}
                variant="outline"
                size="sm"
                className="bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-600 rounded-full px-4 py-2"
              >
                <StickyNote size={16} className="mr-2" />
                {showQuickNote ? 'Ocultar' : 'Nueva Nota'}
              </Button>
            </div>

            {showQuickNote && (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Asignatura
                      </label>
                      <select
                        value={quickNoteSubject}
                        onChange={(e) => setQuickNoteSubject(e.target.value)}
                        className="w-full p-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white"
                      >
                        <option value="">Selecciona una asignatura</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Nota
                      </label>
                      <Input
                        value={quickNoteName}
                        onChange={(e) => setQuickNoteName(e.target.value)}
                        placeholder="Título de la nota..."
                        className="rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido
                    </label>
                    <Textarea
                      value={quickNoteContent}
                      onChange={(e) => setQuickNoteContent(e.target.value)}
                      placeholder="Escribe tu nota aquí..."
                      className="min-h-[120px] rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-400 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleCancelQuickNote}
                      variant="outline"
                      className="rounded-full border-pink-200 hover:bg-pink-50"
                    >
                      <X size={16} className="mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateQuickNote}
                      disabled={isSavingNote || !quickNoteSubject || !quickNoteName.trim()}
                      className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-6"
                    >
                      {isSavingNote ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <Save size={16} className="mr-2" />
                      )}
                      Crear Nota
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Subject View for selected subject */}
        {selectedSubject && (
          <div className="space-y-4">
            <SubjectView
              subject={selectedSubject}
              materials={materials.filter(m => m.subject_id === selectedSubject.id)}
              onAddFile={handleAddFile}
              onChatWithFolder={handleChatWithFolder}
              onViewNotes={handleViewNotes}
              onFileDeleted={() => {
                // Refresh materials for the current subject
                if (selectedSubject?.id) {
                  fetchMaterials(selectedSubject.id);
                }
              }}
            />
          </div>
        )}

      </div>

      {/* Floating Action Button - Only show when not in subject view */}
      {!selectedSubject && (
        <div className="fixed bottom-24 right-6 md:hidden">
          {/* Main Floating Button */}
          <button
            onClick={handleAddSubject}
            className="w-14 h-14 bg-pink-400 hover:bg-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            title="Agregar Asignatura"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Modals */}
      <AddProgramModal
        isOpen={showAddProgram}
        onClose={() => setShowAddProgram(false)}
        onProgramCreated={handleProgramCreated}
      />

      <FileUploadModal
        isOpen={showUpload}
        onClose={() => {
          setShowUpload(false);
          setUploadContext(null);
        }}
        onUploadComplete={handleUploadComplete}
        preselectedSubjectId={uploadContext?.subjectId}
        defaultTopicName={uploadContext?.folderName}
        isTopicOptional={true}
      />

      <AddSubjectModal
        isOpen={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        onSubjectCreated={() => {
          // Refresh subjects and set the new subject as selected
          // The subjects will be refreshed automatically by the hook
          // We'll set the new subject as selected when it loads
          setShowAddSubject(false);
        }}
        programId={selectedProgram?.id || ''}
      />

      <EditSubjectModal
        isOpen={showEditSubject}
        onClose={() => setShowEditSubject(false)}
        onSubjectUpdated={() => {
          setShowEditSubject(false);
          setEditingSubject(null);
          if (selectedProgram?.id) {
            fetchSubjects(selectedProgram.id);
          }
        }}
        subject={editingSubject}
      />
    </div>
  );
}