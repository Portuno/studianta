import { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, Plus, Loader2, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectUpdated: () => void;
  subject: {
    id: string;
    name: string;
    syllabus_file_path?: string | null;
    syllabus_file_name?: string | null;
    syllabus_file_size?: number | null;
    instructor_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
}

interface SubjectEvent {
  id: string;
  name: string;
  eventType: string;
  eventDate: string;
  description: string;
}

interface SubjectSchedule {
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

export const EditSubjectModal = ({ 
  isOpen, 
  onClose, 
  onSubjectUpdated, 
  subject 
}: EditSubjectModalProps) => {
  const { user } = useAuth();
  const [subjectName, setSubjectName] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [instructorName, setInstructorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [events, setEvents] = useState<SubjectEvent[]>([]);
  const [schedules, setSchedules] = useState<SubjectSchedule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'subject' | 'context'>('subject');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with subject data
  useEffect(() => {
    if (subject) {
      setSubjectName(subject.name || "");
      setInstructorName(subject.instructor_name || "");
      setStartDate(subject.start_date || "");
      setEndDate(subject.end_date || "");
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf") {
      setSyllabusFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddEvent = () => {
    const newEvent: SubjectEvent = {
      id: Date.now().toString(),
      name: "",
      eventType: "Exam",
      eventDate: "",
      description: ""
    };
    setEvents([...events, newEvent]);
  };

  const handleUpdateEvent = (id: string, field: keyof SubjectEvent, value: string) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, [field]: value } : event
    ));
  };

  const handleRemoveEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const handleAddSchedule = () => {
    const newSchedule: SubjectSchedule = {
      id: Date.now().toString(),
      dayOfWeek: 1, // Monday default
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      description: ""
    };
    setSchedules([...schedules, newSchedule]);
  };

  const handleUpdateSchedule = (id: string, field: keyof SubjectSchedule, value: string | number) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === id ? { ...schedule, [field]: value } : schedule
    ));
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  const handleSubmit = async () => {
    if (!subjectName.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // Upload new syllabus file if provided
      let syllabusFilePath = subject.syllabus_file_path;
      let syllabusFileName = subject.syllabus_file_name;
      let syllabusFileSize = subject.syllabus_file_size;

      if (syllabusFile) {
        const fileName = `${user.id}/${Date.now()}_${syllabusFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(fileName, syllabusFile);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        
        syllabusFilePath = fileName;
        syllabusFileName = syllabusFile.name;
        syllabusFileSize = syllabusFile.size;
      }

      // Update subject
      const { error: subjectError } = await supabase
        .from('subjects')
        .update({
          name: subjectName.trim(),
          syllabus_file_path: syllabusFilePath,
          syllabus_file_name: syllabusFileName,
          syllabus_file_size: syllabusFileSize,
          instructor_name: instructorName.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null
        })
        .eq('id', subject.id)
        .eq('user_id', user.id);

      if (subjectError) throw subjectError;

      onSubjectUpdated();
      onClose();
      resetForm();

    } catch (error) {
      console.error('Error updating subject:', error);
      alert('Error updating subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubjectName("");
    setSyllabusFile(null);
    setInstructorName("");
    setStartDate("");
    setEndDate("");
    setEvents([]);
    setSchedules([]);
    setActiveTab('subject');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-light text-gray-800">Edit Subject</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Tabs */}
          <div className="flex items-center w-full bg-gray-100 rounded-xl p-1 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab('subject')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative z-10 ${
                activeTab === 'subject' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="Subject"
            >
              Subject
            </button>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2 z-0"></div>
            <button
              type="button"
              onClick={() => setActiveTab('context')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative z-10 ${
                activeTab === 'context' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="Additional Context"
            >
              Additional Context
            </button>
            <div 
              className={`absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-200 z-0 ${
                activeTab === 'subject' ? 'left-1 right-1/2' : 'left-1/2 right-1'
              }`}
            ></div>
          </div>

          {/* Subject Tab Content */}
          {activeTab === 'subject' && (
            <div className="space-y-4">
              {/* Subject Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Subject Name *
                </label>
                <Input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g., Advanced Mathematics, Organic Chemistry"
                  className="w-full rounded-xl border-gray-300 focus:border-pink-400 focus:ring-pink-100 bg-white"
                  disabled={isSubmitting}
                  aria-label="Subject Name"
                />
              </div>

              {/* Syllabus Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Upload Syllabus (PDF) - Optional
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    syllabusFile 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  tabIndex={0}
                  aria-label="Syllabus upload area"
                >
                  {syllabusFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-semibold text-green-800">{syllabusFile.name}</p>
                      <p className="text-xs text-green-700">
                        {(syllabusFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSyllabusFile(null)}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-500 mx-auto" />
                      <p className="text-sm text-gray-700 font-medium">
                        Drag and drop your syllabus PDF here, or click to browse
                      </p>
                      <p className="text-xs text-gray-600">
                        Highly recommended to help AI understand course topics
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 border-gray-400 text-gray-700 hover:bg-gray-100"
                      >
                        Choose PDF File
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Additional Context Tab Content */}
          {activeTab === 'context' && (
            <div className="space-y-6">
              {/* Key Dates & Events */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-pink-600" />
                  <h4 className="font-semibold text-gray-800">Key Dates & Events</h4>
                </div>
                {events.map((event) => (
                  <Card key={event.id} className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Event name"
                        value={event.name}
                        onChange={(e) => handleUpdateEvent(event.id, 'name', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                      <select
                        value={event.eventType}
                        onChange={(e) => handleUpdateEvent(event.id, 'eventType', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                        aria-label="Event type"
                      >
                        {EVENT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={event.eventDate}
                        onChange={(e) => handleUpdateEvent(event.id, 'eventDate', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={event.description}
                        onChange={(e) => handleUpdateEvent(event.id, 'description', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveEvent(event.id)}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Remove Event
                    </Button>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddEvent}
                  className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <Plus size={16} className="mr-2" />
                  Add Event
                </Button>
              </div>

              {/* Course Schedule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-pink-600" />
                  <h4 className="font-semibold text-gray-800">Course Schedule</h4>
                </div>
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) => handleUpdateSchedule(schedule.id, 'dayOfWeek', parseInt(e.target.value))}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                        aria-label="Day of week"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleUpdateSchedule(schedule.id, 'startTime', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleUpdateSchedule(schedule.id, 'endTime', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Location (optional)"
                        value={schedule.location}
                        onChange={(e) => handleUpdateSchedule(schedule.id, 'location', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={schedule.description}
                        onChange={(e) => handleUpdateSchedule(schedule.id, 'description', e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSchedule(schedule.id)}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Remove Schedule
                    </Button>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddSchedule}
                  className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <Plus size={16} className="mr-2" />
                  Add Class Schedule
                </Button>
              </div>

              {/* Course Duration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-pink-600" />
                  <h4 className="font-semibold text-gray-800">Course Duration</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1 font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1 font-medium">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                    />
                  </div>
                </div>
              </div>

              {/* Instructor Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-pink-600" />
                  <h4 className="font-semibold text-gray-800">Instructor Information</h4>
                </div>
                <Input
                  placeholder="Instructor name (optional)"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="rounded-lg border-gray-300 focus:border-pink-400 focus:ring-pink-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full px-6 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!subjectName.trim() || isSubmitting}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6 font-medium"
            aria-disabled={!subjectName.trim()}
          >
            {isSubmitting ? 'Updating...' : 'Update Subject'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 