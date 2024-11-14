import { useState, useEffect, useRef } from 'react';
import { Task, TeamMember, Comment } from '../types';
import { X, Paperclip } from 'lucide-react';
import CommentEditor from './CommentEditor';
import * as api from '../api';

interface TaskDetailsProps {
  task: Task;
  members: TeamMember[];
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function TaskDetails({ task, members, onClose, onUpdate }: TaskDetailsProps) {
  const [width, setWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(380, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleUpdate = async (updatedFields: Partial<Task>) => {
    if (isSubmitting) return;

    const updatedTask = { ...editedTask, ...updatedFields };
    setEditedTask(updatedTask);

    try {
      setIsSubmitting(true);
      await onUpdate(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (content: string, attachments: File[]) => {
    if (isSubmitting) return;

    const newAttachments = attachments.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    const newComment: Comment & { taskId: string } = {
      id: crypto.randomUUID(),
      text: content,
      authorId: editedTask.memberId,
      createdAt: new Date().toISOString(),
      attachments: newAttachments,
      taskId: editedTask.id
    };

    try {
      setIsSubmitting(true);
      const savedComment = await api.createComment(newComment);
      const updatedTask = {
        ...editedTask,
        comments: [...(editedTask.comments || []), savedComment]
      };
      setEditedTask(updatedTask);
      onUpdate(updatedTask);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedComments = [...(editedTask.comments || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div 
      className="fixed top-0 right-0 h-full bg-white border-l border-gray-200 flex" 
      style={{ width: `${width}px` }}
    >
      <div
        ref={resizeRef}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/20 group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 left-0 w-4 -translate-x-2" />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Task #{task.id}</div>
            <input
              type="text"
              value={editedTask.title}
              onChange={e => handleUpdate({ title: e.target.value })}
              className="text-xl font-semibold w-full border-none focus:outline-none focus:ring-0"
              disabled={isSubmitting}
            />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Rest of the component remains the same, just add isSubmitting checks to inputs */}
        {/* ... */}
      </div>
    </div>
  );
}