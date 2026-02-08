import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, sendMessage } from '@/services/telegram/bot';
import { parseTelegramMessage, formatSuccessMessage } from '@/services/telegram/parser';
import { getAdminDb, isAdminConfigured } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Telegram Bot Webhook Handler — Multi-User
 *
 * ONE bot serves ALL users. Each user links their Telegram via /link CODE.
 * All data is scoped to the user's Firebase UID.
 *
 * Commands:
 *   /start     — Welcome message
 *   /help      — Usage guide
 *   /link CODE — Link Telegram to FinTrack AI account
 *   /unlink    — Unlink Telegram account
 *   /balance   — Show user's balance
 *   /history   — Show recent transactions
 *   [text]     — Parse and record transaction
 */
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id.toString();
    const text = update.message.text.trim();
    const username = update.message.from?.username || '';
    const firstName = update.message.from?.first_name || '';

    // ==========================================
    // /start command
    // ==========================================
    if (text === '/start') {
      await sendMessage(
        chatId,
        '👋 <b>Selamat datang di FinTrack AI Bot!</b>\n\n' +
        '🔗 <b>Langkah pertama:</b>\n' +
        '1. Buka FinTrack AI web → Pengaturan\n' +
        '2. Klik "Hubungkan Telegram"\n' +
        '3. Salin kode yang muncul\n' +
        '4. Kirim: /link KODE_ANDA\n\n' +
        '📝 <b>Setelah terhubung, kirim pesan untuk mencatat transaksi:</b>\n' +
        '• "Makan 50000 dari Cash"\n' +
        '• "Gaji 5jt ke Bank"\n' +
        '• "Kopi 25rb"\n\n' +
        '💡 Ketik /help untuk panduan lengkap'
      );
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // /help command
    // ==========================================
    if (text === '/help') {
      await sendMessage(
        chatId,
        '📖 <b>Panduan FinTrack AI Bot</b>\n\n' +
        '<b>🔗 Hubungkan Akun:</b>\n' +
        '/link KODE — Hubungkan Telegram ke akun FinTrack AI\n' +
        '/unlink — Putuskan hubungan\n\n' +
        '<b>💸 Catat Transaksi:</b>\n' +
        '[deskripsi] [jumlah] [dari/ke] [akun]\n\n' +
        '<b>Contoh:</b>\n' +
        '• Makan siang 50000\n' +
        '• Grab 15rb dari GoPay\n' +
        '• Gaji 5jt ke Bank\n' +
        '• Transfer 1jt dari Bank ke Cash\n\n' +
        '<b>📊 Info:</b>\n' +
        '/balance — Lihat saldo\n' +
        '/history — Riwayat transaksi\n\n' +
        '<b>💡 Singkatan:</b>\n' +
        '• rb = ribu (50rb = 50.000)\n' +
        '• jt = juta (5jt = 5.000.000)'
      );
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // /link CODE — Link Telegram to account
    // ==========================================
    if (text.startsWith('/link')) {
      const code = text.split(' ')[1]?.trim().toUpperCase();
      if (!code) {
        await sendMessage(chatId, '❌ Format: /link KODE\n\n Dapatkan kode di FinTrack AI → Pengaturan → Hubungkan Telegram');
        return NextResponse.json({ ok: true });
      }

      if (!isAdminConfigured()) {
        await sendMessage(chatId, '❌ Server belum dikonfigurasi.');
        return NextResponse.json({ ok: true });
      }

      const db = getAdminDb();

      // Look up link code
      const codeRef = db.collection('telegram_link_codes').doc(code);
      const codeDoc = await codeRef.get();

      if (!codeDoc.exists) {
        await sendMessage(chatId, '❌ Kode tidak valid atau sudah kedaluwarsa.\nBuat kode baru di Pengaturan → Hubungkan Telegram.');
        return NextResponse.json({ ok: true });
      }

      const codeData = codeDoc.data()!;

      // Check expiration (5 minutes)
      if (Date.now() > codeData.expiresAt) {
        await codeRef.delete();
        await sendMessage(chatId, '❌ Kode sudah kedaluwarsa.\nBuat kode baru di Pengaturan.');
        return NextResponse.json({ ok: true });
      }

      const userId = codeData.userId;

      // Check if this chatId is already linked to another account
      const existingLink = await db.collection('telegram_links')
        .where('chatId', '==', chatId)
        .limit(1)
        .get();

      if (!existingLink.empty) {
        const existingDoc = existingLink.docs[0];
        if (existingDoc.id !== userId) {
          await sendMessage(chatId, '⚠️ Telegram ini sudah terhubung ke akun lain.\nKirim /unlink dulu untuk memutuskan.');
          return NextResponse.json({ ok: true });
        }
      }

      // Create link
      await db.collection('telegram_links').doc(userId).set({
        userId,
        chatId,
        username: username || null,
        firstName: firstName || null,
        isActive: true,
        linkedAt: FieldValue.serverTimestamp(),
      });

      // Update user document
      await db.collection('users').doc(userId).update({
        telegramChatId: chatId,
      }).catch(() => {});

      // Delete used code
      await codeRef.delete();

      await sendMessage(
        chatId,
        '✅ <b>Akun berhasil dihubungkan!</b>\n\n' +
        'Sekarang Anda bisa mencatat transaksi langsung dari sini.\n\n' +
        '💡 Coba kirim: "Makan siang 50rb"'
      );
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // /unlink — Unlink Telegram
    // ==========================================
    if (text === '/unlink') {
      if (!isAdminConfigured()) {
        await sendMessage(chatId, '❌ Server belum dikonfigurasi.');
        return NextResponse.json({ ok: true });
      }

      const db = getAdminDb();
      const linkQuery = await db.collection('telegram_links')
        .where('chatId', '==', chatId)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (linkQuery.empty) {
        await sendMessage(chatId, '❌ Telegram ini belum terhubung ke akun manapun.');
        return NextResponse.json({ ok: true });
      }

      const linkDoc = linkQuery.docs[0];
      await linkDoc.ref.update({ isActive: false });
      await db.collection('users').doc(linkDoc.id).update({
        telegramChatId: FieldValue.delete(),
      }).catch(() => {});

      await sendMessage(chatId, '✅ Telegram berhasil diputus dari akun FinTrack AI.\nKirim /link KODE untuk menghubungkan kembali.');
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // For all other commands, user must be linked
    // ==========================================
    if (!isAdminConfigured()) {
      await sendMessage(chatId, '❌ Server belum dikonfigurasi.');
      return NextResponse.json({ ok: true });
    }

    const db = getAdminDb();

    // Find linked user
    const linkQuery = await db.collection('telegram_links')
      .where('chatId', '==', chatId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (linkQuery.empty) {
      await sendMessage(
        chatId,
        '❌ <b>Akun belum terhubung</b>\n\n' +
        'Hubungkan Telegram Anda terlebih dahulu:\n' +
        '1. Buka FinTrack AI → Pengaturan\n' +
        '2. Klik "Hubungkan Telegram"\n' +
        '3. Salin kode, lalu kirim /link KODE'
      );
      return NextResponse.json({ ok: true });
    }

    const userId = linkQuery.docs[0].id;

    // ==========================================
    // /balance — Show balance
    // ==========================================
    if (text === '/balance' || text === '/saldo') {
      const walletsSnap = await db.collection('wallets')
        .where('userId', '==', userId)
        .get();

      if (walletsSnap.empty) {
        await sendMessage(chatId, '👛 Belum ada dompet. Tambahkan di FinTrack AI web.');
        return NextResponse.json({ ok: true });
      }

      let total = 0;
      let msg = '👛 <b>Saldo Anda:</b>\n\n';
      walletsSnap.docs.forEach(doc => {
        const w = doc.data();
        const balance = w.balance || 0;
        total += balance;
        const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(balance);
        msg += `${w.icon || '💰'} ${w.name}: ${formatted}\n`;
      });

      const totalFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total);
      msg += `\n<b>Total: ${totalFormatted}</b>`;

      await sendMessage(chatId, msg);
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // /history — Recent transactions
    // ==========================================
    if (text === '/history' || text === '/riwayat') {
      const txSnap = await db.collection('transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      if (txSnap.empty) {
        await sendMessage(chatId, '📝 Belum ada transaksi.');
        return NextResponse.json({ ok: true });
      }

      let msg = '📝 <b>5 Transaksi Terakhir:</b>\n\n';
      txSnap.docs.forEach(doc => {
        const tx = doc.data();
        const emoji = tx.type === 'income' ? '💰' : tx.type === 'expense' ? '💸' : '🔄';
        const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount);
        msg += `${emoji} ${tx.description} — ${amount}\n`;
      });

      await sendMessage(chatId, msg);
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // Transaction parsing
    // ==========================================
    const parsed = parseTelegramMessage(text);

    if (!parsed.isValid) {
      await sendMessage(chatId, `❌ ${parsed.errorMessage}`);
      return NextResponse.json({ ok: true });
    }

    // Create transaction in Firestore
    await db.collection('transactions').add({
      userId,
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description,
      category: parsed.categoryHint || 'others',
      categoryIcon: getCategoryIcon(parsed.categoryHint),
      accountId: null,
      date: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      source: 'telegram',
    });

    // Update wallet balance if account specified
    if (parsed.accountName) {
      const walletSnap = await db.collection('wallets')
        .where('userId', '==', userId)
        .where('type', '==', parsed.accountName)
        .limit(1)
        .get();

      if (!walletSnap.empty) {
        const walletDoc = walletSnap.docs[0];
        const delta = parsed.type === 'income' ? parsed.amount : -parsed.amount;
        await walletDoc.ref.update({
          balance: FieldValue.increment(delta),
        });
      }
    }

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

/** Get category emoji icon */
function getCategoryIcon(category?: string): string {
  const icons: Record<string, string> = {
    foodDrinks: '🍔', transportation: '🚗', shopping: '🛍️',
    entertainment: '🎬', bills: '📄', health: '💊',
    education: '📚', salary: '💰', investment: '📈',
    freelance: '💻', gift: '🎁', others: '📦',
  };
  return icons[category || 'others'] || '📦';
}
