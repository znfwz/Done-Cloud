import React, { useState, useEffect } from 'react';
import { X, Database, Check, AlertCircle, Loader2, Code, Copy, ChevronDown, ChevronRight, RefreshCw, Clock } from 'lucide-react';
import { Language, SupabaseConfig } from '../types.ts';
import { getTranslation } from '../services/i18n.ts';
import { testConnection } from '../services/supabaseService.ts';

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
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center space-x-2">
             <Database size={20} className="text-blue-500" />
             <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('configureSupabase')}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{t('syncConfigDesc')}</p>
          <div className="space-y-3">
             <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('supabaseUrl')}</label>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none dark:text-white" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('supabaseKey')}</label>
                <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none dark:text-white" />
             </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                      <RefreshCw size={16} className="text-gray-500" />
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-200">{t('autoSyncSetting')}</label>
                  </div>
                  <button onClick={() => setAutoSync(!autoSync)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSync ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
             <button onClick={() => setShowGuide(!showGuide)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Code size={16} className="mr-2" />{t('setupGuide')}</span>
                {showGuide ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
             </button>
             {showGuide && (
                <div className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
                   <div className="relative bg-gray-100 dark:bg-gray-800 rounded p-3">
                      <pre className="text-xs font-mono overflow-x-auto text-gray-800 dark:text-gray-200">{sqlCode}</pre>
                      <button onClick={copySql} className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded shadow-sm"><Copy size={12} /></button>
                   </div>
                </div>
             )}
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
          <button onClick={handleSave} disabled={isTesting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70">
            {isTesting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            <span>{isTesting ? t('connectionCheck') : t('saveAndSync')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncConfigModal;