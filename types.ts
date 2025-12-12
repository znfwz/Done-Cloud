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
}

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';