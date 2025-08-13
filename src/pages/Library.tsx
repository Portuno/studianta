import { useState, useEffect } from "react";
import { 
  Search, 
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
  MoreVertical
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePrograms } from "@/hooks/useSupabase";
import { useSubjects } from "@/hooks/useSupabase";
// import { useTopics } from "@/hooks/useSupabase"; // REMOVIDO: useTopics fue eliminado
import { useStudyMaterials } from "@/hooks/useSupabase";
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
  const { programs, loading: programsLoading, error: programsError } = usePrograms();
  const { subjects, loading: subjectsLoading, error: subjectsError, fetchSubjects } = useSubjects();
  const { materials, loading: materialsLoading, error: materialsError, fetchMaterials } = useStudyMaterials();
  const { goals: weeklyGoals, loading: weeklyGoalsLoading, error: weeklyGoalsError, fetchGoals: fetchWeeklyGoals } = useWeeklyGoals();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [uploadContext, setUploadContext] = useState<{ subjectId?: string; folderName?: string } | null>(null);

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
    if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
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
        alert('Error deleting subject. Please try again.');
      }
    }
  };

  const handleAddFile = (opts?: { subjectId?: string; folderName?: string }) => {
    setUploadContext(opts || null);
    setShowUpload(true);
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

  // Filter materials by search query
  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-lavender-50">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">Error Loading Library</h2>
          <p className="text-gray-600 mb-4">There was a problem loading your library data.</p>
          <div className="text-sm text-gray-500 space-y-1">
            {programsError && <p>Programs: {programsError.message}</p>}
            {subjectsError && <p>Subjects: {subjectsError.message}</p>}
            {materialsError && <p>Materials: {materialsError.message}</p>}
            {weeklyGoalsError && <p>Weekly Goals: {weeklyGoalsError.message}</p>}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-pink-400 hover:bg-pink-500"
          >
            Try Again
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
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  // SCENARIO 1: Empty State (No Programs Added)
  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-lavender-50 pb-20">
        {/* Header */}
        <div className="pt-12 pb-6 px-6">
          <h1 className="text-2xl font-light text-gray-800 text-center">Library</h1>
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
              You haven't added any programs yet
            </h2>
            
            {/* Call-to-Action Button */}
            <Button 
              onClick={handleAddProgram}
              className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={20} className="mr-2" />
              Add Program
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-lavender-50 pb-20">
      {/* Header - Dynamic Program Name */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-light text-gray-800">{selectedProgram ? selectedProgram.name : 'Library'}</h1>
              {/* Always show program selector if there are programs */}
              {programs.length > 0 && (
                <button
                  onClick={() => setShowProgramSelector(!showProgramSelector)}
                  className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200 border border-pink-200"
                  title="Change Program"
                >
                  <ChevronDown size={18} className="text-pink-400" />
                </button>
              )}
            </div>
            {programs.length > 1 && (
              <span className="text-xs text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
                {programs.length} programs
              </span>
            )}
          </div>
          
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200"
          >
            <Search size={20} className="text-pink-400" />
          </button>
        </div>

        {/* Program Selector Dropdown */}
        {showProgramSelector && programs.length > 0 && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
            <Card className="rounded-2xl border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <div className="p-2">
                <div className="p-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-600">Select Program</p>
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
                  <span className="font-medium text-green-700">Add New Program</span>
                </button>
              </div>
            </Card>
          </div>
        )}
        
        {/* Search Bar */}
        {showSearch && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
              <Input 
                placeholder="Search your materials..." 
                className="pl-10 rounded-2xl border-pink-200 bg-white/80 backdrop-blur-sm focus:border-pink-300 focus:ring-pink-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
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
              {selectedProgram?.name || 'Library'}
            </button>
            <ChevronRight size={14} />
            <span className="text-pink-400">{selectedSubject.name}</span>
          </div>
        )}

        {/* Subjects View - list subjects for selected program */}
        {!selectedSubject && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Subjects</h2>
            {subjects.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-lavender-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={24} className="text-lavender-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No subjects yet</h3>
                <p className="text-gray-500 mb-4">Create your first subject to organize your files</p>
                <Button 
                  onClick={handleAddSubject}
                  className="bg-lavender-400 hover:bg-lavender-500 text-white rounded-full px-6"
                >
                  <Plus size={16} className="mr-2" />
                  Add Subject
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onEdit={handleEditSubject}
                    onDelete={handleDeleteSubject}
                    onClick={() => setSelectedSubject(subject)}
                  />
                ))}
              </div>
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
            />
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !selectedSubject && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Search Results</h2>
            {filteredMaterials.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <p className="text-gray-500">No materials found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredMaterials.map((material) => (
                  <Card 
                    key={material.id} 
                    className="p-4 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getFileIcon(material.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-800">{material.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {material.subjects?.name || 'Unknown Subject'}
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
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button - Only show when not in subject view */}
      {!selectedSubject && (
        <div className="fixed bottom-24 right-6">
          {/* Main Floating Button */}
          <button
            onClick={handleAddSubject}
            className="w-14 h-14 bg-pink-400 hover:bg-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            title="Add Subject"
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