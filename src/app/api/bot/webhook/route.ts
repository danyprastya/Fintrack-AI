import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, sendMessage } from '@/services/telegram/bot';
import { parseTelegramMessage, formatSuccessMessage } from '@/services/telegram/parser';
// import { getUserByTelegramChatId, createTransaction, getAccounts } from '@/lib/firebase/firestore';
// import { Timestamp } from 'firebase/firestore';

/**
 * Telegram Bot Webhook Handler
 *
 * This endpoint receives updates from the Telegram Bot API.
 * It parses natural language messages and creates transactions.
 *
 * Supported message formats:
 *   "Makan 50000 dari Cash"
 *   "Gaji 5000000 ke Bank"
 *   "Transfer 100000 dari Cash ke Bank"
 *   "makan siang 35rb"
 */
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    // Only process text messages
    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id.toString();
    const text = update.message.text;

    // Handle /start command
    if (text === '/start') {
      await sendMessage(
        chatId,
        '👋 <b>Selamat datang di FinTrack AI Bot!</b>\n\n' +
        'Kirim pesan untuk mencatat transaksi:\n\n' +
        '💸 <b>Pengeluaran:</b>\n' +
        '• "Makan 50000 dari Cash"\n' +
        '• "Kopi 25rb"\n\n' +
        '💰 <b>Pemasukan:</b>\n' +
        '• "Gaji 5000000 ke Bank"\n' +
        '• "Freelance 2jt"\n\n' +
        '🔄 <b>Transfer:</b>\n' +
        '• "Transfer 100rb dari Cash ke Bank"\n\n' +
        '📝 <b>Format singkat:</b>\n' +
        '• Gunakan "rb" untuk ribu (50rb = 50.000)\n' +
        '• Gunakan "jt" untuk juta (5jt = 5.000.000)'
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (text === '/help') {
      await sendMessage(
        chatId,
        '📖 <b>Panduan FinTrack AI Bot</b>\n\n' +
        '<b>Format Pesan:</b>\n' +
        '[deskripsi] [jumlah] [dari/ke] [akun]\n\n' +
        '<b>Contoh:</b>\n' +
        '• Makan siang 50000\n' +
        '• Grab 15rb dari GoPay\n' +
        '• Gaji 5jt ke Bank\n' +
        '• Transfer 1jt dari Bank ke Cash\n\n' +
        '<b>Akun:</b> Cash, Bank, E-Wallet\n\n' +
        '🔗 Hubungkan akun Anda di menu Pengaturan > Hubungkan Telegram'
      );
      return NextResponse.json({ ok: true });
    }

    // Parse the message
    const parsed = parseTelegramMessage(text);

    if (!parsed.isValid) {
      await sendMessage(chatId, `❌ ${parsed.errorMessage}`);
      return NextResponse.json({ ok: true });
    }

    // TODO: Verify user by chat_id
    // const user = await getUserByTelegramChatId(chatId);
    // if (!user) {
    //   await sendMessage(chatId, '❌ Akun tidak terhubung. Hubungkan di Pengaturan > Telegram.');
    //   return NextResponse.json({ ok: true });
    // }

    // TODO: Create transaction in Firestore
    // const accounts = await getAccounts(user.id);
    // const account = accounts.find(a => a.type === (parsed.accountName || 'cash'));
    // if (account) {
    //   await createTransaction({
    //     userId: user.id,
    //     accountId: account.id,
    //     type: parsed.type,
    //     amount: parsed.amount,
    //     date: Timestamp.now(),
    //     categoryId: parsed.categoryHint || 'others',
    //     description: parsed.description,
    //     isRecurring: false,
    //     source: 'telegram',
    //   });
    // }

    // Send success response
    const successMsg = formatSuccessMessage(
      parsed.type,
      parsed.amount,
      parsed.description,
      parsed.accountName
    );
    await sendMessage(chatId, successMsg);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Telegram sends a GET to verify webhook
export async function GET() {
  return NextResponse.json({ status: 'FinTrack AI Bot webhook is active' });
}
