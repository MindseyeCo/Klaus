import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Multi-Database Configuration for Klaus
// Provided keys for redundant profile storage system
const SUPABASE_KEY = "sb_publishable_42axkKLbMnwno5quJhNDmQ_pDyZia96";
// Placeholder URL - assuming a standard project structure or proxy. 
// Since specific URL wasn't provided, we default to a standard pattern or placeholder.
// In a real production environment, this would be the specific project URL.
const SUPABASE_URL = "https://klaus-db-redundancy.supabase.co"; 

// Initialize Supabase Client
let supabase: any;

try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Multi-Database System (Supabase) Initialized");
} catch (e) {
    console.warn("Multi-Database Init Warning:", e);
}

/**
 * Syncs user profile data to the secondary database (Supabase)
 * This ensures redundancy and stability if the primary NoSQL store has issues.
 * @param user Partial user object to sync
 */
export const syncProfileToSupabase = async (user: Partial<User>) => {
    if (!supabase || !user.uid) return;
    
    try {
        // Map Klaus User type to a flattened structure suitable for SQL tables
        const profileData = {
            id: user.uid,
            email: user.email,
            display_name: user.displayName,
            handle: user.handle,
            photo_url: user.photoURL,
            status_message: user.status,
            about: user.about,
            theme_song: user.themeSongUrl,
            updated_at: new Date().toISOString()
        };

        // Fire and forget upsert operation
        // We use 'upsert' to handle both creation and updates
        const { error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });
            
        if (error) {
            // Log but don't throw, as this is a backup system
            console.warn("Supabase Sync Error:", error.message);
        } else {
            console.log("Profile successfully synchronized to Multi-DB System.");
        }
    } catch (error) {
        console.warn("Supabase Critical Sync Fail:", error);
    }
};
