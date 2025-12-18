/**
 * Supabase Configuration for SAVIOR MITRA
 * Optimized for Supabase Free Tier
 */

// Supabase configuration
const SUPABASE_URL = 'https://lagcozgmqzuigoineqax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ2NvemdtcXp1aWdvaW5lcWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjY0MDUsImV4cCI6MjA4MTY0MjQwNX0.-nT4_5KwFSxSxQpO_hh4rYzvV1OshJ2dBSGrBjL63QY';

// Initialize Supabase client (using global supabase from CDN)
const { createClient } = window.supabase;
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache settings for free tier optimization
window.CACHE_CONFIG = {
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB max file size
    SMALL_FILE_THRESHOLD: 1 * 1024 * 1024, // 1 MB - store as base64 in database
    IMAGE_MAX_SIZE: 500 * 1024, // 500 KB for subject images
    USE_CACHE: true // Enable local caching
};

