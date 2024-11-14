import React from 'react';
import { Calendar, Clock, X, Edit2, Info, MessageCircle, Copy, UserCircle2 } from 'lucide-react';
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
  members: TeamMember[];
  onRemove: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onCopy: (task: Task) => void;
  onDragStart: (taskId: string, columnId: string, currentIndex: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onSelect: (task: Task) => void;
  index: number;
}

export default function TaskCard({
  task,
  member,
  members,
  onRemove,
  onEdit,
  onCopy,
  onDragStart,
  onDragEnd,
  onDragOver,
  onSelect,
  index
}: TaskCardProps) {
  const [showQuickEdit, setShowQuickEdit] = React.useState(false);
  const [showMemberSelect, setShowMemberSelect] = React.useState(false);
  const [showCommentTooltip, setShowCommentTooltip] = React.useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragStart(task.id, task.columnId, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e, index);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(task);
  };

  const handleMemberChange = (memberId: string) => {
    onEdit({ ...task, memberId });
    setShowMemberSelect(false);
  };

  const uniqueId = `${task.boardId}-${task.id}-${task.columnId}-${index}`;

  // Get the latest comment
  const latestComment = task.comments && task.comments.length > 0
    ? task.comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Get the author of the latest comment
  const commentAuthor = latestComment
    ? members.find(m => m.id === latestComment.authorId)?.name
    : null;

  // Format the comment date
  const commentDate = latestComment
    ? new Date(latestComment.createdAt).toLocaleDateString()
    : null;

  // Convert UTC date to local date for display
  const localStartDate = new Date(task.startDate + 'T00:00:00')
    .toLocaleDateString();

  return (
    <>
      <div
        className="task-card p-4 rounded-lg shadow-sm mb-3 cursor-move relative"
        style={{ backgroundColor: `${member.color}10`, borderLeft: `4px solid ${member.color}` }}
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        data-task-id={uniqueId}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-800">{task.title}</h3>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMemberSelect(!showMemberSelect);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Change Assignee"
            >
              <UserCircle2 size={16} className="text-gray-500" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Copy Task"
            >
              <Copy size={16} className="text-gray-500" />
            </button>
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
        
        {showMemberSelect && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => handleMemberChange(m.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  m.id === task.memberId ? 'bg-gray-50' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                {m.name}
              </button>
            ))}
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{localStartDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{task.effort}h</span>
          </div>
          <div 
            className="flex items-center gap-1 relative"
            onMouseEnter={() => setShowCommentTooltip(true)}
            onMouseLeave={() => setShowCommentTooltip(false)}
          >
            <MessageCircle size={14} />
            <span>{task.comments?.length || 0}</span>
            
            {showCommentTooltip && latestComment && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg p-3 text-xs z-50">
                <div className="text-gray-900 font-medium mb-1">
                  {commentAuthor} • {commentDate}
                </div>
                <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: latestComment.text }} />
                {latestComment.attachments?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-gray-500">Attachments: {latestComment.attachments.length}</div>
                  </div>
                )}
              </div>
            )}
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
          members={members}
          onClose={() => setShowQuickEdit(false)}
          onSave={onEdit}
        />
      )}
    </>
  );
}