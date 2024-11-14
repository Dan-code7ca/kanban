import React, { useState, useEffect } from 'react';
import { TeamMember, Task, Column, Columns, Priority, Board } from './types';
import TeamMembers from './components/TeamMembers';
import KanbanColumn from './components/Column';
import TaskDetails from './components/TaskDetails';
import BoardHeader from './components/BoardHeader';
import DebugPanel from './components/DebugPanel';
import { Github } from 'lucide-react';
import * as api from './api';

interface QueryLog {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'ERROR';
  query: string;
  timestamp: string;
  error?: string;
}

const DEFAULT_COLUMNS = {
  todo: { id: 'todo', title: 'To Do', tasks: [] },
  progress: { id: 'progress', title: 'In Progress', tasks: [] },
  testing: { id: 'testing', title: 'Testing', tasks: [] },
  completed: { id: 'completed', title: 'Completed', tasks: [] }
};

export default function App() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [columns, setColumns] = useState<Columns>({});
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<{
    id: string;
    sourceColumnId: string;
    currentIndex: number;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [loadedMembers, loadedBoards] = await Promise.all([
          api.getMembers(),
          api.getBoards()
        ]);
        
        setMembers(loadedMembers);
        setBoards(loadedBoards);
        
        if (loadedBoards.length > 0) {
          setSelectedBoard(loadedBoards[0].id);
          setColumns(loadedBoards[0].columns || {});
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Update columns when selected board changes
  useEffect(() => {
    if (selectedBoard) {
      const board = boards.find(b => b.id === selectedBoard);
      if (board) {
        setColumns(board.columns || {});
      }
    }
  }, [selectedBoard, boards]);

  const handleAddMember = async (member: TeamMember) => {
    try {
      const createdMember = await api.createMember(member);
      setMembers([...members, createdMember]);
      if (!selectedMember) setSelectedMember(createdMember.id);
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await api.deleteMember(id);
      setMembers(members.filter(m => m.id !== id));
      if (selectedMember === id) {
        setSelectedMember(members.length > 1 ? members[0].id : null);
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleAddBoard = async () => {
    try {
      const newBoard: Board = {
        id: crypto.randomUUID(),
        title: 'New Board',
        columns: Object.entries(DEFAULT_COLUMNS).reduce((acc, [key, col]) => ({
          ...acc,
          [key]: { ...col, boardId: selectedBoard || '', tasks: [] }
        }), {})
      };

      const createdBoard = await api.createBoard(newBoard);
      setBoards(prev => [...prev, createdBoard]);
      setSelectedBoard(createdBoard.id);
      setColumns(createdBoard.columns);
    } catch (error) {
      console.error('Failed to add board:', error);
    }
  };

  const handleEditBoard = async (boardId: string, title: string) => {
    try {
      await api.updateBoard(boardId, title);
      setBoards(prev => prev.map(b => 
        b.id === boardId ? { ...b, title } : b
      ));
    } catch (error) {
      console.error('Failed to update board:', error);
    }
  };

  const handleRemoveBoard = async (boardId: string) => {
    if (boards.length <= 1) {
      alert('Cannot delete the last board');
      return;
    }

    try {
      await api.deleteBoard(boardId);
      const newBoards = boards.filter(b => b.id !== boardId);
      setBoards(newBoards);
      
      if (selectedBoard === boardId) {
        const firstBoard = newBoards[0];
        setSelectedBoard(firstBoard.id);
        setColumns(firstBoard.columns);
      }
    } catch (error) {
      console.error('Failed to remove board:', error);
    }
  };

  const handleAddTask = async (columnId: string) => {
    if (!selectedMember || !selectedBoard) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: 'New Task',
      description: 'Task description',
      memberId: selectedMember,
      startDate: new Date().toISOString().split('T')[0],
      effort: 1,
      columnId,
      priority: 'medium' as Priority,
      requesterId: selectedMember,
      boardId: selectedBoard,
      comments: []
    };

    try {
      const createdTask = await api.createTask(task);
      setColumns(prev => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          tasks: [...prev[columnId].tasks, createdTask]
        }
      }));
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleEditTask = async (task: Task) => {
    try {
      const updatedTask = await api.updateTask(task);
      setColumns(prev => {
        const newColumns = { ...prev };
        Object.keys(newColumns).forEach(columnId => {
          newColumns[columnId].tasks = newColumns[columnId].tasks.map(t =>
            t.id === task.id ? updatedTask : t
          );
        });
        return newColumns;
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setColumns(prev => {
        const newColumns = { ...prev };
        Object.keys(newColumns).forEach(columnId => {
          newColumns[columnId].tasks = newColumns[columnId].tasks.filter(
            t => t.id !== taskId
          );
        });
        return newColumns;
      });
    } catch (error) {
      console.error('Failed to remove task:', error);
    }
  };

  const handleCopyTask = async (task: Task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      title: `${task.title} (Copy)`,
      comments: []
    };

    try {
      const createdTask = await api.createTask(newTask);
      setColumns(prev => ({
        ...prev,
        [task.columnId]: {
          ...prev[task.columnId],
          tasks: [...prev[task.columnId].tasks, createdTask]
        }
      }));
    } catch (error) {
      console.error('Failed to copy task:', error);
    }
  };

  const handleEditColumn = async (columnId: string, title: string) => {
    try {
      await api.updateColumn(columnId, title);
      setColumns(prev => ({
        ...prev,
        [columnId]: { ...prev[columnId], title }
      }));
    } catch (error) {
      console.error('Failed to update column:', error);
    }
  };

  const handleRemoveColumn = async (columnId: string) => {
    try {
      await api.deleteColumn(columnId);
      const { [columnId]: removed, ...remainingColumns } = columns;
      setColumns(remainingColumns);
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const handleAddColumn = async () => {
    if (!selectedBoard) return;

    const columnId = crypto.randomUUID();
    const newColumn: Column = {
      id: columnId,
      title: 'New Column',
      tasks: [],
      boardId: selectedBoard
    };

    try {
      const createdColumn = await api.createColumn(newColumn);
      setColumns(prev => ({
        ...prev,
        [columnId]: createdColumn
      }));
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  };

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleColumnDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;

    setColumns(prev => {
      const entries = Object.entries(prev);
      const draggedIndex = entries.findIndex(([key]) => key === draggedColumn);
      const targetIndex = entries.findIndex(([key]) => key === targetColumnId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newEntries = [...entries];
      const [draggedEntry] = newEntries.splice(draggedIndex, 1);
      newEntries.splice(targetIndex, 0, draggedEntry);
      
      return Object.fromEntries(newEntries);
    });
  };

  const handleTaskDragStart = (taskId: string, sourceColumnId: string, currentIndex: number) => {
    setDraggedTask({ id: taskId, sourceColumnId, currentIndex });
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
    setDraggedColumn(null);
  };

  const handleTaskDragOver = async (e: React.DragEvent, targetColumnId: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { id: draggedTaskId, sourceColumnId } = draggedTask;
    const sourceColumn = columns[sourceColumnId];
    const targetColumn = columns[targetColumnId];
    
    if (!sourceColumn || !targetColumn) return;

    const taskToMove = sourceColumn.tasks.find(t => t.id === draggedTaskId);
    if (!taskToMove) return;

    const updatedTask = { ...taskToMove, columnId: targetColumnId };

    try {
      await api.updateTask(updatedTask);
      
      setColumns(prev => {
        const newColumns = { ...prev };
        
        // Remove task from source column
        newColumns[sourceColumnId] = {
          ...sourceColumn,
          tasks: sourceColumn.tasks.filter(t => t.id !== draggedTaskId)
        };
        
        // Add task to target column at specific index
        const targetTasks = [...targetColumn.tasks];
        targetTasks.splice(targetIndex, 0, updatedTask);
        newColumns[targetColumnId] = {
          ...targetColumn,
          tasks: targetTasks
        };
        
        return newColumns;
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  // Calculate grid columns based on number of columns
  const columnCount = Object.keys(columns).length;
  const gridCols = columnCount <= 4 ? 4 : Math.min(6, columnCount);
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridCols}, minmax(300px, 1fr))`,
    gap: '1.5rem',
    width: '100%',
    overflowX: 'auto'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="https://drenlia.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-700">
              Drenlia Inc.
            </a>
            <BoardHeader
              boards={boards}
              selectedBoard={selectedBoard}
              onSelectBoard={setSelectedBoard}
              onAddBoard={handleAddBoard}
              onEditBoard={handleEditBoard}
              onRemoveBoard={handleRemoveBoard}
            />
          </div>
          <a
            href="https://github.com/Dan-code7ca/kanban"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900"
          >
            <Github size={24} />
          </a>
        </div>
      </header>

      <div className={`flex-1 p-6 ${selectedTask ? 'pr-96' : ''}`}>
        <div className="max-w-[1400px] mx-auto">
          <TeamMembers
            members={members}
            selectedMember={selectedMember}
            onSelectMember={setSelectedMember}
            onAdd={handleAddMember}
            onRemove={handleRemoveMember}
          />

          {selectedBoard && (
            <div style={gridStyle}>
              {Object.values(columns).map(column => (
                <KanbanColumn
                  key={`${selectedBoard}-${column.id}`}
                  column={column}
                  members={members}
                  selectedMember={selectedMember}
                  onAddTask={handleAddTask}
                  onRemoveTask={handleRemoveTask}
                  onEditTask={handleEditTask}
                  onCopyTask={handleCopyTask}
                  onEditColumn={handleEditColumn}
                  onRemoveColumn={handleRemoveColumn}
                  onAddColumn={handleAddColumn}
                  onDragStart={handleColumnDragStart}
                  onDragOver={handleColumnDragOver}
                  onTaskDragStart={handleTaskDragStart}
                  onTaskDragEnd={handleTaskDragEnd}
                  onTaskDragOver={handleTaskDragOver}
                  onSelectTask={setSelectedTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className="fixed top-0 right-0 h-full">
          <TaskDetails
            task={selectedTask}
            members={members}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleEditTask}
          />
        </div>
      )}

      <DebugPanel
        logs={queryLogs}
        onClear={() => setQueryLogs([])}
      />
    </div>
  );
}
