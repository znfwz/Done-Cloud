import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, Language } from '../types.ts';
import { Trash2, Edit2, Check, X, CalendarClock } from 'lucide-react';
import { getTranslation } from '../services/i18n.ts';

interface LogItemProps {
  entry: LogEntry;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newContent: string, newTimestamp?: string) => void;
  lang: Language;
}

const LogItem: React.FC<LogItemProps> = ({ entry, onDelete, onUpdate, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.content);
  const t = (key: string) => getTranslation(lang, key);
  
  const toLocalISOString = (dateObj: Date) => {
    const offset = dateObj.getTimezoneOffset() * 60000; 
    const localDate = new Date(dateObj.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  const [editTime, setEditTime] = useState(toLocalISOString(new Date(entry.timestamp)));
  const inputRef = useRef<HTMLInputElement>(null);

  const timeString = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim()) {
      const selectedTime = new Date(editTime);
      const now = new Date();

      if (selectedTime > now) {
        alert(t('futureTimeError'));
        return;
      }

      const newTimestamp = selectedTime.toISOString();
      onUpdate(entry.id, editValue, newTimestamp);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(entry.content);
    setEditTime(toLocalISOString(new Date(entry.timestamp)));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="group flex items-start space-x-3 py-3 px-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
      <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1 min-w-[3rem] text-right shrink-0">
        {timeString}
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1">
                <CalendarClock size={14} className="text-gray-400 mr-2" />
                <input 
                  type="datetime-local" 
                  value={editTime}
                  max={toLocalISOString(new Date())}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="text-xs bg-transparent border-none focus:ring-0 text-gray-600 dark:text-gray-300 p-0 font-mono"
                />
              </div>
              <div className="flex items-center space-x-1 ml-auto">
                <button onClick={handleSave} className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 p-1.5 bg-green-50 dark:bg-green-900/30 rounded">
                  <Check size={16} />
                </button>
                <button onClick={handleCancel} className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">
            {entry.content}
          </p>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity md:w-16 justify-end shrink-0">
           <button 
            onClick={() => setIsEditing(true)} 
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title={t('edit')}
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(entry.id)} 
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title={t('delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default LogItem;