const SUPABASE_URL = "https://qurdsbkqnrhipyepdndt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QM0fkbfBA_A-V4EG63b5xA_qhJzE3El";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});