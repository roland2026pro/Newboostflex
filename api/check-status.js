import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ message: 'Phone required' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase
      .from('verifikasi_requests')
      .select('status')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ message: 'No request found' });
    res.json({ status: data[0].status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil status' });
  }
}