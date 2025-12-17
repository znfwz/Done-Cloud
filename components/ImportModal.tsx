import React, { useState, useRef } from 'react';
import { X, FileUp, Database, CheckCircle } from 'lucide-react';
import { LogEntry, Language } from '../types.ts';
import { getTranslation } from '../services/i18n.ts';
import { generateId } from '../services/storage.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: LogEntry[]) => void;
  lang: Language;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, lang }) => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string, params?: Record<string, any>) => {
    let text = getTranslation(lang, key);
    if (params) {
      Object.keys(params).forEach(k => {
        text = text.replace(`{${k}}`, params[k]);
      });
    }
    return text;
  };

  if (!isOpen) return null;

  const parseImportText = (text: string): LogEntry[] => {
    const lines = text.split('\n');
    const parsed: LogEntry[] = [];
    const regex = /^\[(.*?)\]\s+(.*)$/;
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      const match = cleanLine.match(regex);
      if (match) {
        const dateStr = match[1];
        const content = match[2];
        const timestamp = new Date(dateStr);
        if (!isNaN(timestamp.getTime())) {
          parsed.push({
            id: generateId(),
            content: content.trim(),
            timestamp: timestamp.toISOString()
          });
        }
      }
    }
    return parsed;
  };

  const handleImportAction = () => {
    if (!inputText.trim()) return;

    const entries = parseImportText(inputText);
    if (entries.length > 0) {
      onImport(entries);
      setStatus({ type: 'success', message: t('importSuccess', { count: entries.length }) });
      setTimeout(() => {
        setStatus(null);
        setInputText('');
        onClose();
      }, 1500);
    } else {
      setStatus({ type: 'error', message: t('importError') });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800">

        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('importTitle')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pasteLabel')}</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FileUp size={12} className="mr-1" /> {t('uploadFile')}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <textarea
              className="w-full h-40 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:outline-none resize-none"
              placeholder={t('pastePlaceholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {status && (
            <div className={`p-3 rounded-lg text-sm flex items-center ${status.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {status.type === 'success' ? <CheckCircle size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
              {status.message}
            </div>
          )}

          <button
            onClick={handleImportAction}
            disabled={!inputText.trim()}
            className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow hover:bg-gray-800 dark:hover:bg-gray-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database size={18} />
            <span>{t('importBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;