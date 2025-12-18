import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { LogEntry, Language } from '../types.ts';
import { getTranslation } from '../services/i18n.ts';
import Timeline from './Timeline.tsx';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LogEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, newContent: string, newTimestamp?: string) => void;
  lang: Language;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, entries, onDelete, onUpdate, lang }) => {
  const [keyword, setKeyword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => getTranslation(lang, key);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setKeyword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEntries = keyword.trim() 
    ? entries.filter(e => e.content.toLowerCase().includes(keyword.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-4 border-b border-gray-100 dark:border-gray-800 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input ref={inputRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none" />
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {!keyword.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 space-y-2">
              <Search size={48} />
              <p className="text-sm">{t('searchPlaceholder')}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>{t('noSearchResults')}</p>
            </div>
          ) : (
            <Timeline entries={filteredEntries} onDelete={onDelete} onUpdate={onUpdate} lang={lang} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;