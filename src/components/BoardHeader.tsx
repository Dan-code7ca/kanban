import React from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { Board } from '../types';
import RenameModal from './RenameModal';

interface BoardHeaderProps {
  boards: Board[];
  selectedBoard: string;
  onSelectBoard: (boardId: string) => void;
  onAddBoard: () => void;
  onEditBoard: (boardId: string, newName: string) => void;
  onRemoveBoard: (boardId: string) => void;
}

export default function BoardHeader({
  boards,
  selectedBoard,
  onSelectBoard,
  onAddBoard,
  onEditBoard,
  onRemoveBoard
}: BoardHeaderProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showRenameModal, setShowRenameModal] = React.useState(false);
  const currentBoard = boards.find(b => b.id === selectedBoard);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <select
          value={selectedBoard}
          onChange={(e) => onSelectBoard(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
        >
          {boards.map(board => (
            <option key={board.id} value={board.id}>
              {board.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Settings2 size={18} className="text-gray-500" />
        </button>
      </div>

      {showMenu && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50">
          <button
            onClick={() => {
              onAddBoard();
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Board
          </button>
          <button
            onClick={() => {
              setShowRenameModal(true);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Rename Board
          </button>
          <button
            onClick={() => {
              onRemoveBoard(selectedBoard);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Delete Board
          </button>
        </div>
      )}

      {showRenameModal && currentBoard && (
        <RenameModal
          title="Rename Board"
          currentName={currentBoard.title}
          onSubmit={(newName) => {
            onEditBoard(selectedBoard, newName);
            setShowRenameModal(false);
          }}
          onClose={() => setShowRenameModal(false)}
        />
      )}
    </div>
  );
}