import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Plus, Upload, Clock, User, MapPin } from "lucide-react";
import { FileStatusBadge } from "./FileStatusBadge";
import { Input } from "@/components/ui/input";

interface TopicViewProps {
  topic: {
    id: string;
    name: string;
    subject_id: string;
  };
  subject: {
    id: string;
    name: string;
    syllabus_file_name?: string | null;
    instructor_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
  materials: any[];
  onAddFile: (opts?: { subjectId?: string; folderName?: string }) => void;
  onBack: () => void;
}

interface TopicEvent {
  id: string;
  name: string;
  eventType: string;
  eventDate: string;
  description: string;
}

interface TopicSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
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

export const TopicView = ({ topic, subject, materials, onAddFile, onBack }: TopicViewProps) => {
  const [activeTab, setActiveTab] = useState<'files' | 'calendar'>('files');
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mock data - in real app this would come from the database
  const topicEvents: TopicEvent[] = [
    {
      id: "1",
      name: "Midterm Exam",
      eventType: "Exam",
      eventDate: "2024-02-15",
      description: "Covers chapters 1-5"
    },
    {
      id: "2",
      name: "Lab Report Due",
      eventType: "Assignment Due",
      eventDate: "2024-02-20",
      description: "Submit via Canvas"
    }
  ];

  const topicSchedules: TopicSchedule[] = [
    {
      id: "1",
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "10:30",
      location: "Room 201",
      description: "Lecture"
    },
    {
      id: "2",
      dayOfWeek: 3, // Wednesday
      startTime: "14:00",
      endTime: "16:00",
      location: "Lab 105",
      description: "Practical Session"
    }
  ];

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
      // This will handle the actual file upload logic
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
          {subject.syllabus_file_name && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Course Syllabus
              </h3>
              <Card className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800">{subject.syllabus_file_name}</h4>
                    <p className="text-sm text-blue-600">Course syllabus and overview</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                    View
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Topic Materials Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">📚</span>
                Topic Materials
              </h3>
              
            </div>

            {materials.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-mint-100 flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-mint-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No files yet</h3>
                <p className="text-gray-500 mb-4">Upload your first file to this topic</p>
                
                {/* File Upload Form */}
                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      File Name *
                    </label>
                    <Input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="e.g., Constitutional Law Notes, Case Study Analysis"
                      className="w-full rounded-lg border-gray-300 focus:border-mint-400 focus:ring-mint-100"
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Attach File *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-mint-400 transition-colors">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 text-mint-600 mx-auto" />
                          <p className="text-sm font-medium text-mint-800">{selectedFile.name}</p>
                          <p className="text-xs text-mint-700">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                            className="border-mint-300 text-mint-700 hover:bg-mint-100"
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-500 mx-auto" />
                          <p className="text-sm text-gray-700 font-medium">
                            Click to browse or drag and drop
                          </p>
                          <p className="text-xs text-gray-600">
                            Supports: PDF, Word, Excel, Text, Images
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-input')?.click()}
                            className="mt-2 border-gray-400 text-gray-700 hover:bg-gray-100"
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                  
                  <Button
                    onClick={handleFileUpload}
                    disabled={!fileName.trim() || !selectedFile || isUploading}
                    className="w-full bg-mint-400 hover:bg-mint-500 text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* File Upload Form - When there are existing files */}
                <Card className="p-4 rounded-xl border border-mint-200 bg-mint-50">
                  <div className="space-y-4">
                    <h4 className="font-medium text-mint-800 flex items-center gap-2">
                      <Plus size={16} />
                      Add New File
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-mint-700 mb-2">
                          File Name *
                        </label>
                        <Input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="e.g., Additional Notes, Case Study"
                          className="w-full rounded-lg border-mint-300 focus:border-mint-500 focus:ring-mint-100"
                          disabled={isUploading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-mint-700 mb-2">
                          Attach File *
                        </label>
                        <div className="border-2 border-dashed border-mint-300 rounded-lg p-3 text-center hover:border-mint-500 transition-colors">
                          {selectedFile ? (
                            <div className="space-y-2">
                              <FileText className="h-6 w-6 text-mint-600 mx-auto" />
                              <p className="text-sm font-medium text-mint-800 truncate">{selectedFile.name}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                                className="border-mint-300 text-mint-700 hover:bg-mint-100 text-xs"
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-6 w-6 text-mint-500 mx-auto" />
                              <p className="text-xs text-mint-600">Click to browse</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('file-input-existing')?.click()}
                                className="border-mint-300 text-mint-700 hover:bg-mint-100 text-xs"
                              >
                                Choose File
                              </Button>
                            </div>
                          )}
                        </div>
                        <input
                          id="file-input-existing"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleFileUpload}
                      disabled={!fileName.trim() || !selectedFile || isUploading}
                      className="bg-mint-500 hover:bg-mint-600 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </div>
                </Card>

                {materials.map((material) => (
                  <Card 
                    key={material.id} 
                    className="p-4 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm"
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
            )}
          </div>
        </div>
      )}

      {/* Calendar Tab Content */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Key Dates & Events */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Key Dates & Events
            </h3>
            {topicEvents.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No events scheduled</h3>
                <p className="text-gray-500">Add important dates and deadlines for this topic</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {topicEvents.map((event) => (
                  <Card key={event.id} className="p-4 rounded-xl border border-red-200 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {event.eventType}
                          </span>
                          <span className="text-sm text-red-600 font-medium">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-red-800 mb-1">{event.name}</h4>
                        <p className="text-sm text-red-700">{event.description}</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-red-300 text-red-700">
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Class Schedule */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Class Schedule
            </h3>
            {topicSchedules.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-sm bg-white/80 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No schedule set</h3>
                <p className="text-gray-500">Add class times and locations for this topic</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {topicSchedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4 rounded-xl border border-green-200 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        <h4 className="font-semibold text-green-800 mb-1">{schedule.description}</h4>
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <MapPin size={14} />
                          <span>{schedule.location}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-green-300 text-green-700">
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Summary Modal */}
      {/* Removed Smart Summary Modal */}
    </div>
  );
}; 