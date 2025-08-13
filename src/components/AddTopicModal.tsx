import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated: () => void;
  subjectId: string;
}

export const AddTopicModal = ({ isOpen, onClose, onTopicCreated, subjectId }: AddTopicModalProps) => {
  const { user } = useAuth();
  const [topicName, setTopicName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('topics')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          name: topicName.trim(),
        });

      if (error) throw error;

      onTopicCreated();
      onClose();
      resetForm();

    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Error creating topic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTopicName("");
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
          <h2 className="text-2xl font-light text-gray-800">Create Topic</h2>
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
              Topic Name *
            </label>
            <Input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Introduction to Constitutional Law, Civil Rights Cases"
              className="w-full rounded-xl border-gray-300 focus:border-pink-400 focus:ring-pink-100 bg-white"
              disabled={isSubmitting}
              aria-label="Topic Name"
            />
            <p className="text-xs text-gray-500 mt-2">
              Topics help you organize your study materials by specific areas or concepts.
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
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!topicName.trim() || isSubmitting}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6 font-medium"
            aria-disabled={!topicName.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Topic'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 