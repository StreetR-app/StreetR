//js&supabase.js
const SUPABASE_URL = 'https://qdmlbedacymowcgtykvm.supabase.co'; // YOUR_SUPABASE_URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbWxiZWRhY3ltb3djZ3R5a3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjMwOTUsImV4cCI6MjA2NDgzOTA5NX0.oQ98WG4hXtlwTUaj5Aj9R6UVHPZvgR0iQnhxuVtVfRc'; // YOUR_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
    alert("Application is not configured correctly. Supabase credentials missing in js/js_supabase.js");
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose supabase client globally
window.supabase = supabase;
