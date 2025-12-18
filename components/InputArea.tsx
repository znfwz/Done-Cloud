import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';
import { Language } from '../types.ts';
import { getTranslation } from '../services/i18n.ts';

interface InputAreaProps {
  onAdd: (content: string) => void;
  lang: Language;
}

const InputArea: React.FC<InputAreaProps> = ({ onAdd, lang }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => getTranslation(lang, key);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleFocus = () => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 pb-6 md:pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={handleFocus}
          placeholder={t('placeholder')}
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-0 rounded-xl px-4 py-3.5 pr-12 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-base shadow-inner dark:shadow-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className={`absolute right-2 p-2 rounded-lg transition-all duration-200 ${
            text.trim() 
              ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-md hover:bg-gray-700 dark:hover:bg-gray-600 transform hover:scale-105' 
              : 'bg-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {text.trim() ? <CornerDownLeft size={20} /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default InputArea;