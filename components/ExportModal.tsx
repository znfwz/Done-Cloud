import React, { useState } from 'react';
import { X, Copy, CheckCircle, Sparkles, FileText, Loader2, AlignLeft, List, Calendar, Archive } from 'lucide-react';
import { LogEntry, ExportRange, Language } from '../types.ts';
import { generateWeeklyReport } from '../services/geminiService.ts';
import { getTranslation } from '../services/i18n.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LogEntry[];
  lang: Language;
  apiKey: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, entries, lang, apiKey }) => {
  const [copiedState, setCopiedState] = useState<'none' | 'today' | 'week' | 'month' | 'all'>('none');
  const [format, setFormat] = useState<'raw' | 'grouped'>('raw');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  
  const t = (key: string) => getTranslation(lang, key);

  if (!isOpen) return null;

  const getFilteredEntries = (range: ExportRange) => {
    const now = new Date();
    
    return entries.filter(e => {
      const t = new Date(e.timestamp).getTime();
      
      if (range === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return t >= todayStart;
      }
      if (range === 'week') {
         const d = new Date(now);
         const day = d.getDay();
         const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
         d.setDate(diff);
         d.setHours(0,0,0,0);
         return t >= d.getTime();
      }
      if (range === 'month') {
         const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
         return t >= monthStart;
      }
      if (range === 'all') {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); 
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
             const textArea = document.createElement("textarea");
             textArea.value = text;
             textArea.style.position = "fixed";
             textArea.style.left = "-9999px";
             document.body.appendChild(textArea);
             textArea.focus();
             textArea.select();
             document.execCommand('copy');
             document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error("Copy failed", err);
        throw err;
    }
  };

  const handleCopy = (range: ExportRange) => {
    const filtered = getFilteredEntries(range);
    let text = "";

    if (format === 'raw') {
        text = filtered.map(e => {
            const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = new Date(e.timestamp).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US');
            return `[${date} ${time}] ${e.content}`;
        }).join('\n');
    } else {
        const groups: {[key: string]: LogEntry[]} = {};
        filtered.forEach(e => {
            const date = new Date(e.timestamp).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(e);
        });
        
        const uniqueDates = Array.from(new Set(filtered.map(e => 
            new Date(e.timestamp).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            })
        ))) as string[];

        text = uniqueDates.map(date => {
            const items = groups[date].map(e => {
                 const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 return `- [${time}] ${e.content}`;
            }).join('\n');
            return `### ${date}\n${items}`;
        }).join('\n\n');
    }

    const textToCopy = text || (lang === 'zh' ? "无记录" : "No logs found");
    
    copyToClipboard(textToCopy).then(() => {
      setCopiedState(range);
      setTimeout(() => setCopiedState('none'), 2000);
    }).catch(() => {
       alert(t('copyFailed'));
    });
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiReport(null);
    const filtered = getFilteredEntries('week');
    const report = await generateWeeklyReport(filtered, lang, apiKey);
    setAiReport(report);
    setIsGenerating(false);
  };

  const handleCopyAIReport = () => {
      if (aiReport) {
          copyToClipboard(aiReport).then(() => {
              setCopiedState('week');
              setTimeout(() => setCopiedState('none'), 2000);
          });
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('exportTitle')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto">
          <div>
             <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('format')}</label>
             <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button 
                  onClick={() => setFormat('raw')}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${format === 'raw' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                   <AlignLeft size={16} />
                   <div className="flex flex-col items-start leading-tight">
                      <span>{t('formatRaw')}</span>
                   </div>
                </button>
                <button 
                  onClick={() => setFormat('grouped')}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${format === 'grouped' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                   <List size={16} />
                   <div className="flex flex-col items-start leading-tight">
                      <span>{t('formatGrouped')}</span>
                   </div>
                </button>
             </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('quickCopy')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleCopy('today')} className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                {copiedState === 'today' ? <CheckCircle className="text-green-500 mb-2" /> : <Copy className="text-gray-600 dark:text-gray-400 mb-2" />}
                <span className="font-medium text-gray-900 dark:text-gray-100">{t('copyToday')}</span>
              </button>
              <button onClick={() => handleCopy('week')} className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                 {copiedState === 'week' && !aiReport ? <CheckCircle className="text-green-500 mb-2" /> : <Copy className="text-gray-600 dark:text-gray-400 mb-2" />}
                <span className="font-medium text-gray-900 dark:text-gray-100">{t('copyWeek')}</span>
              </button>
               <button onClick={() => handleCopy('month')} className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                 {copiedState === 'month' ? <CheckCircle className="text-green-500 mb-2" /> : <Calendar className="text-gray-600 dark:text-gray-400 mb-2" />}
                <span className="font-medium text-gray-900 dark:text-gray-100">{t('copyMonth')}</span>
              </button>
               <button onClick={() => handleCopy('all')} className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                 {copiedState === 'all' ? <CheckCircle className="text-green-500 mb-2" /> : <Archive className="text-gray-600 dark:text-gray-400 mb-2" />}
                <span className="font-medium text-gray-900 dark:text-gray-100">{t('copyAll')}</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <Sparkles size={14} className="mr-1 text-purple-500" /> {t('aiAssistant')}
            </h3>
            {apiKey ? (
              !aiReport ? (
                <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl flex items-center justify-center space-x-2">
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                  <span>{isGenerating ? t('generating') : t('generateReport')}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
                    {aiReport}
                  </div>
                  <div className="flex space-x-2">
                      <button onClick={handleCopyAIReport} className="flex-1 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm">{t('copyReport')}</button>
                      <button onClick={() => setAiReport(null)} className="px-4 py-2 border dark:border-gray-700 rounded-lg text-sm">{t('back')}</button>
                  </div>
                </div>
              )
            ) : (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 text-xs rounded-lg">{t('configureKey')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;