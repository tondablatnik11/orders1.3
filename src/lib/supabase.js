import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ucgiatobbjnqertgtmsw.supabase.co";
// DŮLEŽITÉ: Vložte svůj public anon key
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZ2lhdG9iYmpucWVydGd0bXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTg1MjgsImV4cCI6MjA2Njg5NDUyOH0.EgqlPh4VHPsmHEII1snAmJgyZBp8rkf6u5N7SAxA4zs";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);