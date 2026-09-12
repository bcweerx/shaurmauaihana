const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
if (!token || token.length < 20) throw Error('TELEGRAM_BOT_TOKEN is missing.');
if (!/^-?\d+$/.test(chatId || '')) throw Error('TELEGRAM_CHAT_ID must be numeric.');
const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
  signal: AbortSignal.timeout(8000),
});
if (!response.ok) throw Error(`Telegram returned HTTP ${response.status}.`);
const body = await response.json();
if (body.ok !== true || !body.result?.is_bot) throw Error('Telegram credentials were rejected.');
console.log(`Telegram credentials are valid for @${body.result.username || body.result.first_name || 'bot'}; chat ID is configured.`);
