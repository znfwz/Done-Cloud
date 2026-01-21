import React, { useState } from 'react';
import { X, Copy, CheckCircle, Sparkles, FileText, Loader2, AlignLeft, List, Calendar, Archive, Clock } from 'lucide-react';
import { LogEntry, ExportRange, Language } from '../types';
import { generateAIReport } from '../services/geminiService';
import { getTranslation } from '../services/i18n';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LogEntry[];
  lang: Language;
  apiKey: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, entries, lang, apiKey }) => {
  const [copiedState, setCopiedState] = useState<'none' | 'today' | 'week' | 'month' | 'year' | 'all'>('none');
  const [format, setFormat] = useState<'raw' | 'grouped'>('raw');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiRange, setAiRange] = useState<'week' | 'month' | 'year'>('week');
  
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
      if (range === 'year') {
         const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
         return t >= yearStart;
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
             // Fallback
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
    const filtered = getFilteredEntries(aiRange); 
    const report = await generateAIReport(filtered, aiRange, lang, apiKey);
    setAiReport(report);
    setIsGenerating(false);
  };

  const handleCopyAIReport = () => {
      if (aiReport) {
          copyToClipboard(aiReport).then(() => {
              // We don't really have a 'state' for copy report button feedback in the main block, 
              // but we can just let the button feedback handled there if we wanted.
              // Re-using setCopiedState might confuse the other buttons, but let's leave it simple.
              alert(t('copied'));
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
          
          {/* Format Selector */}
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
            <div className="grid grid-cols-3 gap-3">
              {/* Today */}
              <button 
                onClick={() => handleCopy('today')}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95"
              >
                {copiedState === 'today' ? <CheckCircle size={20} className="text-green-500 mb-1" /> : <Copy size={20} className="text-gray-600 dark:text-gray-400 mb-1" />}
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{t('copyToday')}</span>
              </button>

              {/* Week */}
              <button 
                onClick={() => handleCopy('week')}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95"
              >
                 {copiedState === 'week' ? <CheckCircle size={20} className="text-green-500 mb-1" /> : <Copy size={20} className="text-gray-600 dark:text-gray-400 mb-1" />}
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{t('copyWeek')}</span>
              </button>

              {/* Month */}
               <button 
                onClick={() => handleCopy('month')}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95"
              >
                 {copiedState === 'month' ? <CheckCircle size={20} className="text-green-500 mb-1" /> : <Calendar size={20} className="text-gray-600 dark:text-gray-400 mb-1" />}
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{t('copyMonth')}</span>
              </button>
              
               {/* Year */}
               <button 
                onClick={() => handleCopy('year')}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95"
              >
                 {copiedState === 'year' ? <CheckCircle size={20} className="text-green-500 mb-1" /> : <Clock size={20} className="text-gray-600 dark:text-gray-400 mb-1" />}
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{t('copyYear')}</span>
              </button>

              {/* All */}
               <button 
                onClick={() => handleCopy('all')}
                className="col-span-2 flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95"
              >
                 {copiedState === 'all' ? <CheckCircle size={20} className="text-green-500 mb-1" /> : <Archive size={20} className="text-gray-600 dark:text-gray-400 mb-1" />}
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{t('copyAll')}</span>
              </button>

            </div>
          </div>

          {/* AI Feature */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <Sparkles size={14} className="mr-1 text-purple-500" /> {t('aiAssistant')}
              </h3>
            </div>
            
            {apiKey ? (
              !aiReport ? (
                <div className="space-y-3">
                  {/* Scope Selector */}
                  <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex text-sm">
                    {(['week', 'month', 'year'] as const).map((scope) => (
                      <button
                        key={scope}
                        onClick={() => setAiRange(scope)}
                        className={`flex-1 py-1.5 rounded-md transition-all font-medium ${
                          aiRange === scope 
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                         {scope === 'week' && t('scopeWeek')}
                         {scope === 'month' && t('scopeMonth')}
                         {scope === 'year' && t('scopeYear')}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="w-full py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-gray-800 hover:to-gray-700 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    <span>{isGenerating ? t('generating') : t('generateReport')}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 max-h-60 overflow-y-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700 font-mono">
                    {aiReport}
                  </div>
                  <div className="flex space-x-2">
                      <button 
                          onClick={handleCopyAIReport}
                          className="flex-1 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                          {t('copyReport')}
                      </button>
                      <button 
                          onClick={() => setAiReport(null)}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                          {t('back')}
                      </button>
                  </div>
                </div>
              )
            ) : (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs rounded-lg flex items-center">
                {t('configureKey')}
              </div>
            )}
             <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">{t('aiDisclaimer')}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExportModal;