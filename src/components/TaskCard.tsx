import React from 'react';
import { Calendar, Clock, X, Edit2, Info } from 'lucide-react';
import { Task, TeamMember, Priority } from '../types';
import QuickEditModal from './QuickEditModal';

const PRIORITY_COLORS = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-700'
};

interface TaskCardProps {
  task: Task;
  member: TeamMember;
  onRemove: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDragStart: (taskId: string, columnId: string, currentIndex: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onSelect: (task: Task) => void;
  index: number;
}

export default function TaskCard({
  task,
  member,
  onRemove,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onSelect,
  index
}: TaskCardProps) {
  const [showQuickEdit, setShowQuickEdit] = React.useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragStart(task.id, task.columnId, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e, index);
  };

  return (
    <>
      <div
        className="task-card p-4 rounded-lg shadow-sm mb-3 cursor-move"
        style={{ backgroundColor: `${member.color}10`, borderLeft: `4px solid ${member.color}` }}
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-800">{task.title}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setShowQuickEdit(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Quick Edit"
            >
              <Edit2 size={16} className="text-gray-500" />
            </button>
            <button
              onClick={() => onSelect(task)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="View Details"
            >
              <Info size={16} className="text-gray-500" />
            </button>
            <button
              onClick={() => onRemove(task.id)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{new Date(task.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{task.effort}h</span>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[task.priority]}`}
          >
            {task.priority}
          </div>
        </div>
      </div>

      {showQuickEdit && (
        <QuickEditModal
          task={task}
          onClose={() => setShowQuickEdit(false)}
          onSave={onEdit}
        />
      )}
    </>
  );
}