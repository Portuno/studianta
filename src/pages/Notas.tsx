import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  StickyNote, 
  Plus, 
  Loader2, 
  AlertCircle, 
  BookOpen, 
  Edit3, 
  Trash2, 
  Save,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotes, useSubjects, usePrograms } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface NoteWithSubject {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  subject_id: string;
  subjects: {
    id: string;
    name: string;
    program_id: string;
    programs: {
      id: string;
      name: string;
    };
  };
}

export default function Notas() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const { notes, loading: notesLoading, error: notesError, addNote, updateNote, deleteNote, fetchNotes } = useNotes();
  const { subjects, loading: subjectsLoading, error: subjectsError, fetchSubjects } = useSubjects();
  const { programs, loading: programsLoading } = usePrograms();
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteWithSubject | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteName, setNoteName] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubjectId, setNoteSubjectId] = useState<string>("");
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load subjects when programs are available
  useEffect(() => {
    if (programs.length > 0) {
      // Load subjects for all programs
      programs.forEach(program => {
        fetchSubjects(program.id);
      });
    }
  }, [programs]);

  // Handle URL parameter for preselected subject
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam && subjects.length > 0) {
      const subject = subjects.find(s => s.id === subjectParam);
      if (subject) {
        setSelectedSubject(subjectParam);
      }
    }
  }, [searchParams, subjects]);

  // Filter notes by selected subject
  const filteredNotes = selectedSubject 
    ? notes.filter(note => note.subject_id === selectedSubject)
    : notes;

  // Show all subjects in the selector, not just those with notes
  const allSubjects = subjects;

  const handleCreateNote = async () => {
    if (!noteSubjectId) {
      alert('Por favor selecciona una asignatura para la nota');
      return;
    }

    // For "general" notes, we need to create a special subject or handle differently
    // For now, we'll use the first available subject as a fallback
    const subjectId = noteSubjectId === "general" ? allSubjects[0]?.id : noteSubjectId;
    
    if (!subjectId) {
      alert('No hay asignaturas disponibles. Por favor, crea una asignatura primero.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await addNote({
        subject_id: subjectId,
        name: noteName || `Nota - ${new Date().toLocaleString('es-ES')}`,
        content: noteContent
      });

      if (error) {
        throw error;
      }

      // Reset form
      setNoteName("");
      setNoteContent("");
      setNoteSubjectId("");
      setSelectedNote(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error al crear la nota. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;

    setIsSaving(true);
    try {
      const { error } = await updateNote(selectedNote.id, {
        name: noteName,
        content: noteContent
      });

      if (error) {
        throw error;
      }

      setSelectedNote(null);
      setIsEditing(false);
      setNoteName("");
      setNoteContent("");
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Error al actualizar la nota. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;

    try {
      const { error } = await deleteNote(noteId);
      if (error) throw error;

      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
        setNoteName("");
        setNoteContent("");
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error al eliminar la nota. Por favor, inténtalo de nuevo.');
    }
  };

  const handleEditNote = (note: NoteWithSubject) => {
    setSelectedNote(note);
    setNoteName(note.name);
    setNoteContent(note.content);
    setNoteSubjectId(note.subject_id);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteName("");
    setNoteContent("");
    setNoteSubjectId("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSelectedNote(null);
    setIsEditing(false);
    setNoteName("");
    setNoteContent("");
    setNoteSubjectId("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loading = notesLoading || subjectsLoading || programsLoading;
  const hasError = notesError || subjectsError;

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-lavender-50">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">Error al Cargar las Notas</h2>
          <p className="text-gray-600 mb-4">Hubo un problema al cargar tus notas.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-pink-400 hover:bg-pink-500"
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
          <p className="text-gray-600">Cargando tus notas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-lavender-50 pb-20 md:pb-6">
      {/* Header */}
      <div className="pt-12 md:pt-6 pb-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-light text-gray-800">Notas</h1>
          <Button 
            onClick={handleNewNote}
            className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-4 py-2"
          >
            <Plus size={16} className="mr-2" />
            Nueva Nota
          </Button>
        </div>

        {/* Subject Selector */}
        <div className="mb-4">
          <Button
            onClick={() => setShowSubjectSelector(!showSubjectSelector)}
            variant="outline"
            className="w-full justify-between bg-white/80 backdrop-blur-sm border-pink-200 hover:bg-pink-50"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={16} />
              {selectedSubject 
                ? subjects.find(s => s.id === selectedSubject)?.name || 'Seleccionar Asignatura'
                : 'Todas las Asignaturas'
              }
            </span>
            {showSubjectSelector ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>

          {showSubjectSelector && (
            <Card className="mt-2 rounded-2xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <div className="p-2">
                <div className="p-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-600">Filtrar por Asignatura</p>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedSubject(null);
                    setShowSubjectSelector(false);
                  }}
                  className={`w-full p-3 rounded-xl hover:bg-pink-50 transition-colors text-left flex items-center gap-3 ${
                    !selectedSubject ? 'bg-pink-50 border border-pink-200' : ''
                  }`}
                >
                  <BookOpen size={16} className="text-pink-400" />
                  <span className="font-medium text-gray-800">Todas las Asignaturas</span>
                  {!selectedSubject && <span className="ml-auto text-pink-500">✓</span>}
                </button>

                {allSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubject(subject.id);
                      setShowSubjectSelector(false);
                    }}
                    className={`w-full p-3 rounded-xl hover:bg-pink-50 transition-colors text-left flex items-center gap-3 ${
                      selectedSubject === subject.id ? 'bg-pink-50 border border-pink-200' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <BookOpen size={16} className="text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{subject.name}</span>
                      <p className="text-xs text-gray-500">
                        {programs.find(p => p.id === subject.program_id)?.name || 'Programa'}
                      </p>
                    </div>
                    {selectedSubject === subject.id && <span className="ml-auto text-pink-500">✓</span>}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes List */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700">
              {selectedSubject 
                ? `Notas de ${subjects.find(s => s.id === selectedSubject)?.name}`
                : 'Todas las Notas'
              }
            </h2>
            
            {filteredNotes.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                  <StickyNote size={24} className="text-pink-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {selectedSubject ? 'No hay notas en esta asignatura' : 'No tienes notas aún'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedSubject 
                    ? 'Crea tu primera nota para esta asignatura'
                    : 'Crea tu primera nota para empezar a organizar tus ideas'
                  }
                </p>
                <Button 
                  onClick={handleNewNote}
                  className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-6"
                >
                  <Plus size={16} className="mr-2" />
                  Crear Nota
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <Card 
                    key={note.id} 
                    className={`p-4 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedNote?.id === note.id ? 'ring-2 ring-pink-200 bg-pink-50' : ''
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{note.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {note.subjects.name} • {formatDate(note.updated_at)}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {note.content || 'Sin contenido...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(note);
                          }}
                          className="h-8 w-8 p-0 hover:bg-pink-100"
                        >
                          <Edit3 size={14} className="text-pink-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700">
              {isEditing ? (selectedNote ? 'Editar Nota' : 'Nueva Nota') : 'Editor'}
            </h2>
            
            {isEditing ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asignatura
                    </label>
                    <Select value={noteSubjectId} onValueChange={setNoteSubjectId}>
                      <SelectTrigger className="rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-400">
                        <SelectValue placeholder="Selecciona una asignatura o General" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-pink-400" />
                            <span>General</span>
                          </div>
                        </SelectItem>
                        {allSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex items-center gap-2">
                              <BookOpen size={16} className="text-pink-400" />
                              <span>{subject.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Nota
                    </label>
                    <Input
                      value={noteName}
                      onChange={(e) => setNoteName(e.target.value)}
                      placeholder="Nombre de la nota..."
                      className="rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido
                    </label>
                    <Textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Escribe tu nota aquí..."
                      className="min-h-[300px] rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-400 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={selectedNote ? handleUpdateNote : handleCreateNote}
                      disabled={isSaving || !noteName.trim() || !noteSubjectId}
                      className="flex-1 bg-pink-400 hover:bg-pink-500 text-white rounded-full"
                    >
                      {isSaving ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <Save size={16} className="mr-2" />
                      )}
                      {selectedNote ? 'Actualizar' : 'Crear'} Nota
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="rounded-full border-pink-200 hover:bg-pink-50"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                  <StickyNote size={24} className="text-pink-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {selectedNote ? 'Nota Seleccionada' : 'Selecciona una Nota'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedNote 
                    ? 'Haz clic en "Editar" para modificar esta nota'
                    : 'Selecciona una nota de la lista para editarla o crea una nueva'
                  }
                </p>
                {!selectedNote && (
                  <Button 
                    onClick={handleNewNote}
                    className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-6"
                  >
                    <Plus size={16} className="mr-2" />
                    Crear Nueva Nota
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}