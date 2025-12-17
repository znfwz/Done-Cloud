export interface LogEntry {
  id: string;
  content: string;
  timestamp: string; // ISO string - Business time
  modifiedAt?: string; // ISO string - System edit time
  isDeleted?: boolean; // Soft delete flag
}

export interface GroupedLogs {
  [dateString: string]: LogEntry[];
}

export type ExportRange = 'today' | 'week' | 'month' | 'all';

export interface GenerateReportOptions {
  range: ExportRange;
  entries: LogEntry[];
}

export interface SupabaseConfig {
  url: string;
  key: string;
  initialized: boolean;
  autoSync?: boolean; // Enable auto sync
  syncInterval?: number; // 0 = Startup only, >0 = Minutes
}

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';

// Babel Standalone specific fix: 
// Force this file to be treated as a module even if all other exports are types (which get erased).
export const _module_marker_ = true;