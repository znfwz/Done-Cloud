import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LogEntry, SupabaseConfig } from '../types.ts';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

// Helper to create client with safe storage options
const createSafeClient = (url: string, key: string): SupabaseClient => {
  try {
    return createClient(url, key, {
      auth: {
        // If localStorage is blocked (Tracking Prevention), don't crash, just don't persist session
        persistSession: typeof window !== 'undefined' && !!window.localStorage,
        storageKey: 'done_app_supabase_auth'
      }
    });
  } catch (e) {
    console.warn("Supabase init failed with defaults, retrying without persistence", e);
    // Fallback if the standard init fails hard
    return createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
};

export const getSupabaseClient = (url: string, key: string) => {
  if (!supabaseInstance || url !== currentUrl || key !== currentKey) {
    supabaseInstance = createSafeClient(url, key);
    currentUrl = url;
    currentKey = key;
  }
  return supabaseInstance;
};

export const testConnection = async (url: string, key: string): Promise<boolean> => {
    try {
        const sb = createSafeClient(url, key);
        const { error } = await sb.from('logs').select('id').limit(1);
        if (error) {
             console.error("Supabase Connection Error:", error);
             return false;
        }
        return true;
    } catch (e) {
        console.error("Supabase Connection Exception:", e);
        return false;
    }
}

export const syncWithCloud = async (
  localEntries: LogEntry[], 
  trashEntries: LogEntry[], 
  config: SupabaseConfig
): Promise<{ success: boolean; mergedEntries?: LogEntry[]; mergedTrash?: LogEntry[]; error?: any }> => {
  try {
    const sb = getSupabaseClient(config.url, config.key);

    // 1. Prepare Local Data
    const localActive = localEntries.map(e => ({ ...e, isDeleted: false }));
    const localTrash = trashEntries.map(e => ({ ...e, isDeleted: true }));
    const allLocal = [...localActive, ...localTrash];

    // 2. Fetch all cloud entries
    const { data: cloudData, error: fetchError } = await sb.from('logs').select('*');
    if (fetchError) throw fetchError;
    const cloudEntries = cloudData as LogEntry[] || [];

    // 3. Merge & Conflict Resolution (Step 1: ID-based)
    const mergedMap = new Map<string, LogEntry>();

    // Initial population from Cloud
    cloudEntries.forEach(entry => mergedMap.set(entry.id, entry));

    // Merge Local into Map
    allLocal.forEach(localEntry => {
        const cloudEntry = mergedMap.get(localEntry.id);
        if (!cloudEntry) {
            // New local item
            mergedMap.set(localEntry.id, localEntry);
        } else {
            // Conflict: Last Write Wins based on modifiedAt
            const cloudMod = new Date(cloudEntry.modifiedAt || cloudEntry.timestamp).getTime();
            const localMod = new Date(localEntry.modifiedAt || localEntry.timestamp).getTime();
            
            // If local is newer or equal, overwrite cloud version in map
            if (localMod >= cloudMod) {
                mergedMap.set(localEntry.id, localEntry);
            }
        }
    });

    // 4. De-duplication (Content-based)
    const contentGroups = new Map<string, LogEntry[]>();
    
    Array.from(mergedMap.values()).forEach(entry => {
        const signature = `${new Date(entry.timestamp).toISOString()}|${entry.content.trim()}`;
        if (!contentGroups.has(signature)) {
            contentGroups.set(signature, []);
        }
        contentGroups.get(signature)?.push(entry);
    });

    contentGroups.forEach(group => {
        if (group.length > 1) {
            group.sort((a, b) => {
                if (a.isDeleted !== b.isDeleted) return a.isDeleted ? 1 : -1; 
                return a.id.localeCompare(b.id);
            });

            const winner = group[0];
            const losers = group.slice(1);

            losers.forEach(loser => {
                const updatedLoser = { 
                    ...loser, 
                    isDeleted: true, 
                    modifiedAt: new Date().toISOString() 
                };
                mergedMap.set(loser.id, updatedLoser);
            });
        }
    });

    const finalMerged = Array.from(mergedMap.values());

    // 5. Upsert changes to Cloud
    const { error: upsertError } = await sb.from('logs').upsert(finalMerged);
    if (upsertError) throw upsertError;

    // 6. Split back into Active and Trash for App state
    const newEntries = finalMerged.filter(e => !e.isDeleted);
    const newTrash = finalMerged.filter(e => e.isDeleted);

    newTrash.sort((a, b) => {
        const timeA = new Date(a.modifiedAt || a.timestamp).getTime();
        const timeB = new Date(b.modifiedAt || b.timestamp).getTime();
        return timeB - timeA;
    });

    return { 
        success: true, 
        mergedEntries: newEntries,
        mergedTrash: newTrash
    };

  } catch (error: any) {
    console.error("Sync failed details:", error);
    const errorMsg = error?.message || JSON.stringify(error);
    return { success: false, error: errorMsg };
  }
};