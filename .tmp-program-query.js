const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: false }).limit(20);
  console.log('ERROR', error ? error.message : 'none');
  console.log('COUNT', data ? data.length : 0);
  if (data && data.length) console.log(JSON.stringify(data, null, 2));
})();
