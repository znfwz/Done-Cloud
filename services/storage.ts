import { LogEntry, Language, Theme, SupabaseConfig } from '../types';

const STORAGE_KEY = 'done_app_logs_v1';
const LANG_KEY = 'done_app_lang';
const THEME_KEY = 'done_app_theme';
const API_KEY_STORAGE = 'done_app_api_key';
const TRASH_KEY = 'done_app_trash_v1';
const SUPABASE_CONFIG_KEY = 'done_app_supabase_config';

// Simple ID generator that works in all browser contexts
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const loadEntries = (): LogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load entries", e);
    return [];
  }
};

export const saveEntries = (entries: LogEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save entries", e);
  }
};

export const loadTrash = (): LogEntry[] => {
  try {
    const stored = localStorage.getItem(TRASH_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load trash", e);
    return [];
  }
};

export const saveTrash = (trash: LogEntry[]): void => {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  } catch (e) {
    console.error("Failed to save trash", e);
  }
};

export const loadLanguage = (): Language => {
  try {
    return (localStorage.getItem(LANG_KEY) as Language) || 'zh';
  } catch (e) {
    return 'zh';
  }
};

export const saveLanguage = (lang: Language): void => {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    console.error("Failed to save language", e);
  }
};

export const loadTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY) as Theme;
    if (stored) return stored;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  } catch (e) {
    return 'light';
  }
};

export const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error("Failed to save theme", e);
  }
};

export const loadApiKey = (): string => {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch (e) {
    return '';
  }
};

export const saveApiKey = (key: string): void => {
  try {
    localStorage.setItem(API_KEY_STORAGE, key);
  } catch (e) {
    console.error("Failed to save API Key", e);
  }
};

export const loadSupabaseConfig = (): SupabaseConfig | null => {
  try {
    const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save Supabase config", e);
  }
};