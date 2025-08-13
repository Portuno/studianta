import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Plus, Upload, Clock, User, MapPin, Folder } from "lucide-react";
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
  files: any[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const EVENT_TYPES = [
  "Exam",
  "Practical Activity",
  "Project Submission",
  "Presentation",
  "Quiz",
  "Assignment Due",
  "Lab Session",
  "Other"
];

export const SubjectView = ({ subject, materials, onAddFile }: SubjectViewProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'calendar'>('files');
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
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

      // Initialize folders as empty - they will be created by the user
      setFolders([]);

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
      alert('Please select a supported file type: PDF, Word, Excel, Text, or Image files.');
    }
  };

  const handleFileUpload = async () => {
    if (!fileName.trim() || !selectedFile) {
      alert('Please provide a file name and select a file.');
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
      alert('Error uploading file. Please try again.');
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

  const handleCreateFolder = (folderName: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      files: []
    };
    setFolders([...folders, newFolder]);
  };

  const handleEditFolder = (folderId: string, newName: string) => {
    setFolders(folders.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    ));
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(folder => folder.id !== folderId));
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

  const handleAddEvent = async () => {
    if (!user) return;
    
    const newEvent = {
      name: "New Event",
      event_type: "exam",
      event_date: new Date().toISOString().split('T')[0],
      description: ""
    };

    try {
      const { data, error } = await supabase
        .from('subject_events')
        .insert({
          user_id: user.id,
          subject_id: subject.id,
          ...newEvent
        })
        .select()
        .single();

      if (error) throw error;
      setEvents([...events, data]);
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event. Please try again.');
    }
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
      alert('Error adding schedule. Please try again.');
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
          aria-label="Files"
        >
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">📂</span>
            <span>Files</span>
          </div>
        </button>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2 z-0"></div>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative z-10 ${
            activeTab === 'calendar' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'
          }`}
          aria-label="Calendar"
        >
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">🗓️</span>
            <span>Calendar</span>
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
                Course Syllabus
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
                      Course syllabus and overview
                      {subject.instructor_name && `, ${subject.instructor_name}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                      View
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
                        alert(`File path: ${subject.syllabus_file_path}\nFull URL: ${fullUrl}`);
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📁</span>
                Folders
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onAddFile({ subjectId: subject.id })}
                  className="bg-pink-400 hover:bg-pink-500 text-white rounded-lg px-4 py-2"
                >
                  <Upload size={16} className="mr-2" />
                  Add File
                </Button>
                <Button
                  onClick={() => setShowCreateFolder(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
                >
                  <Plus size={16} className="mr-2" />
                  Create Folder
                </Button>
              </div>
            </div>

            {folders.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Folder size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No folders yet</h3>
                <p className="text-gray-500 mb-4">Create folders to organize your study materials</p>
                <Button 
                  onClick={() => setShowCreateFolder(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6"
                >
                  <Plus size={16} className="mr-2" />
                  Create First Folder
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
                  />
                ))}
              </div>
            )}
          </div>

          {/* Loose Files Section */}
          {materials.filter(m => !folders.some(f => f.files.includes(m))).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📄</span>
                Other Files
              </h3>
              <div className="space-y-2">
                {materials.filter(m => !folders.some(f => f.files.includes(m))).map((material) => (
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
                Key Dates & Events
              </h3>
              <Button
                onClick={handleAddEvent}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2"
              >
                <Plus size={16} className="mr-2" />
                Add Event
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No events scheduled</h3>
                <p className="text-gray-500">Add important dates and deadlines for this subject</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4 rounded-xl border border-red-200 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {event.event_type}
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
                        <Input
                          value={event.description || ''}
                          onChange={(e) => handleUpdateEvent(event.id, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="border-red-200 bg-white"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEvent(event.id)}
                        className="text-red-700 border-red-300 hover:bg-red-50 ml-4"
                      >
                        Remove
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
                Class Schedule
              </h3>
              <Button
                onClick={handleAddSchedule}
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2"
              >
                <Plus size={16} className="mr-2" />
                Add Schedule
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No schedule set</h3>
                <p className="text-gray-500">Add class times and locations for this subject</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4 rounded-xl border border-green-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs text-green-700 mb-1">Day</label>
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
                            <label className="block text-xs text-green-700 mb-1">Time</label>
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
                          placeholder="Location (optional)"
                          className="border-green-300 bg-white mb-2"
                        />
                        <Input
                          value={schedule.description || ''}
                          onChange={(e) => handleUpdateSchedule(schedule.id, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="border-green-300 bg-white"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSchedule(schedule.id)}
                        className="text-green-700 border-green-300 hover:bg-green-50 ml-4"
                      >
                        Remove
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
          fileName={subject.syllabus_file_name || 'Syllabus'}
          onClose={() => setShowPDFViewer(false)}
        />
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}; 