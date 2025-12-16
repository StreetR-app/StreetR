//js&supabase.js
const SUPABASE_URL = 'https://fdtbltfnkbdonzlvcvcg.supabase.co'; // YOUR_SUPABASE_URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdGJsdGZua2Jkb256bHZjdmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDIxMDYsImV4cCI6MjA4MTQ3ODEwNn0._m-JWFrEt2zA2Uj2OQtjI-uGP5QktZFrr7Fm90wdHuI'; // YOUR_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
    alert("Application is not configured correctly. Supabase credentials missing in js/js_supabase.js");
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose supabase client globally
window.supabase = supabase;
