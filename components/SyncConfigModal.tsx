import React, { useState, useEffect } from 'react';
import { X, Database, Check, AlertCircle, Loader2, Code, Copy, ChevronDown, ChevronRight, RefreshCw, Clock } from 'lucide-react';
import { Language, SupabaseConfig } from '../types';
import { getTranslation } from '../services/i18n';
import { testConnection } from '../services/supabaseService';

interface SyncConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SupabaseConfig) => void;
  lang: Language;
  existingConfig: SupabaseConfig | null;
}

const SyncConfigModal: React.FC<SyncConfigModalProps> = ({ isOpen, onClose, onSave, lang, existingConfig }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(0);

  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const t = (key: string, params?: any) => {
    let text = getTranslation(lang, key);
    if (params) {
        Object.keys(params).forEach(k => text = text.replace(`{${k}}`, params[k]));
    }
    return text;
  };

  useEffect(() => {
    if (isOpen) {
        if (existingConfig) {
            setUrl(existingConfig.url);
            setKey(existingConfig.key);
            setAutoSync(!!existingConfig.autoSync);
            setSyncInterval(existingConfig.syncInterval || 0);
        } else {
            // Defaults
            setUrl('');
            setKey('');
            setAutoSync(false);
            setSyncInterval(0);
        }
        setError(null);
    }
  }, [isOpen, existingConfig]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!url.trim() || !key.trim()) {
        setError(lang === 'zh' ? "请填写完整信息" : "Please fill in all fields");
        return;
    }

    setIsTesting(true);
    setError(null);

    // Test connection
    const success = await testConnection(url.trim(), key.trim());
    
    setIsTesting(false);

    if (success) {
        onSave({
            url: url.trim(),
            key: key.trim(),
            initialized: true,
            autoSync: autoSync,
            syncInterval: syncInterval
        });
        onClose();
    } else {
        setError(t('connectFailed'));
    }
  };

  // Include modifiedAt and isDeleted in schema
  const sqlCode = `create table logs (
  id text primary key,
  content text,
  timestamp text,
  "modifiedAt" text,
  "isDeleted" boolean default false
);`;

  const copySql = () => {
     navigator.clipboard.writeText(sqlCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center space-x-2">
             <Database size={20} className="text-blue-500" />
             <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('configureSupabase')}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
             {t('syncConfigDesc')}
          </p>

          {/* URL & Key Inputs */}
          <div className="space-y-3">
             <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('supabaseUrl')}</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('supabaseKey')}</label>
                <input 
                  type="password" 
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
             </div>
          </div>

          {/* Auto Sync Settings */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                      <RefreshCw size={16} className="text-gray-500" />
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-200">{t('autoSyncSetting')}</label>
                  </div>
                  <button 
                      onClick={() => setAutoSync(!autoSync)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoSync ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>

              {autoSync && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                             <Clock size={14} />
                             <span>{t('syncInterval')}</span>
                          </div>
                          <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
                             {syncInterval === 0 ? t('startupOnly') : t('everyMin', { min: syncInterval })}
                          </span>
                      </div>
                      <input 
                          type="range" 
                          min="0" 
                          max="30" 
                          step="1" // Step 1 to allow fine control, or specific steps
                          value={syncInterval}
                          onChange={(e) => {
                             // Snap to logical steps: 0, 1, 5, 10, 15, 30
                             const val = parseInt(e.target.value);
                             // Logic to snap to nearest preferred values if desired, or just raw minutes
                             // Let's use raw minutes but suggest sticking to common ones visually if we had marks
                             setSyncInterval(val);
                          }}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                          <span>Start</span>
                          <span>1m</span>
                          <span>15m</span>
                          <span>30m</span>
                      </div>
                  </div>
              )}
          </div>
          
          {/* SQL Guide Collapsible */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
             <button 
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 text-left"
             >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                   <Code size={16} className="mr-2 text-gray-500" />
                   {t('setupGuide')}
                </span>
                {showGuide ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
             </button>
             
             {showGuide && (
                <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {t('setupGuideDesc')}
                   </p>
                   <div className="relative bg-gray-100 dark:bg-gray-800 rounded p-3">
                      <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {sqlCode}
                      </pre>
                      <button 
                        onClick={copySql}
                        className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        title={t('copySql')}
                      >
                         <Copy size={12} className="text-gray-600 dark:text-gray-300" />
                      </button>
                   </div>
                </div>
             )}
          </div>

          {error && (
            <div className="flex items-center text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded break-all">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isTesting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {isTesting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            <span>{isTesting ? t('connectionCheck') : t('saveAndSync')}</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default SyncConfigModal;