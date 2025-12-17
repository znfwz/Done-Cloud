import React from 'react';
import { LogEntry, GroupedLogs, Language } from '../types.ts';
import LogItem from './LogItem.tsx';
import { getTranslation } from '../services/i18n.ts';

interface TimelineProps {
  entries: LogEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, newContent: string, newTimestamp?: string) => void;
  lang: Language;
}

const Timeline: React.FC<TimelineProps> = ({ entries, onDelete, onUpdate, lang }) => {
  const t = (key: string) => getTranslation(lang, key);

  // Sort entries: Newest first within the array
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const groupedLogs: GroupedLogs = sortedEntries.reduce((acc, entry) => {
    // Determine header: Today, Yesterday, or Date String
    const entryDate = new Date(entry.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey = entryDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });

    if (entryDate.toDateString() === today.toDateString()) {
      dateKey = 'today'; // Use key for translation
    } else if (entryDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'yesterday'; // Use key for translation
    }

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as GroupedLogs);

  // Get keys (dates) and preserve the order
  const orderedKeys = Array.from(new Set(sortedEntries.map(entry => {
     const entryDate = new Date(entry.timestamp);
     const today = new Date();
     const yesterday = new Date(today);
     yesterday.setDate(yesterday.getDate() - 1);
 
     if (entryDate.toDateString() === today.toDateString()) return 'today';
     if (entryDate.toDateString() === yesterday.toDateString()) return 'yesterday';
     
     return entryDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
  })));

  const getDisplayDate = (key: string) => {
      if (key === 'today') return t('today');
      if (key === 'yesterday') return t('yesterday');
      return key;
  };

  return (
    <div className="flex flex-col space-y-8 pb-4">
      {sortedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <p className="text-lg font-medium">{t('noLogs')}</p>
            <p className="text-sm">{t('startTyping')}</p>
        </div>
      ) : (
        orderedKeys.map(dateKey => (
          <div key={dateKey} className="animate-fade-in">
            <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm py-2 mb-2 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-1">
                {getDisplayDate(dateKey)}
              </h3>
            </div>
            <div className="space-y-1">
              {groupedLogs[dateKey].map(entry => (
                <LogItem 
                  key={entry.id} 
                  entry={entry} 
                  onDelete={onDelete} 
                  onUpdate={onUpdate}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Timeline;