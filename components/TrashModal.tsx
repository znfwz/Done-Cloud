import React from 'react';
import { X, Trash2, RefreshCcw } from 'lucide-react';
import { LogEntry, Language } from '../types.ts';
import { getTranslation } from '../services/i18n.ts';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: LogEntry[];
  onRestore: (id: string) => void;
  onEmpty: () => void;
  lang: Language;
}

const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose, trashItems, onRestore, onEmpty, lang }) => {
  const t = (key: string) => getTranslation(lang, key);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <Trash2 size={20} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('trash')}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto min-h-[200px]">
          {trashItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-20 space-y-2">
              <Trash2 size={48} />
              <p>{t('trashEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 text-center">{t('trashLimit')}</p>
              {trashItems.map(item => (
                <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-0 mr-3">
                     <p className="text-xs text-gray-400 mb-1 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                     <p className="text-sm text-gray-800 dark:text-gray-200 break-words line-clamp-2">{item.content}</p>
                  </div>
                  <button onClick={() => onRestore(item.id)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-full"><RefreshCcw size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        {trashItems.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={onEmpty} className="w-full flex items-center justify-center space-x-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
              <Trash2 size={16} />
              <span>{t('emptyTrash')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashModal;