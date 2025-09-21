import TelegramBot from 'node-telegram-bot-api';
import connectDB from './mongodb';
import Client from '../models/Client';
import Message from '../models/Message';
import Promo from '../models/Promo';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot;
if (BOT_TOKEN) {
  console.log('🤖 Initializing Telegram bot with token:', BOT_TOKEN.substring(0, 10) + '...');
  bot = new TelegramBot(BOT_TOKEN);
} else {
  console.error('❌ No TELEGRAM_BOT_TOKEN found in environment variables');
}

export async function handleTelegramUpdate(update) {
  console.log('🤖 Handling Telegram update...');
  
  try {
    await connectDB();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
  
  const message = update.message;
  if (!message) {
    console.log('⚠️ No message in update');
    return;
  }
  
  console.log('📝 Processing message from:', message.from.first_name);

  try {
    // Save or update client
    const clientData = {
      telegramId: message.from.id.toString(),
      firstName: message.from.first_name,
      lastName: message.from.last_name || '',
      username: message.from.username || '',
      language: message.from.language_code || 'en'
    };

    let client = await Client.findOne({ telegramId: clientData.telegramId });
    if (!client) {
      client = new Client(clientData);
      await client.save();
    } else {
      // Update client info if changed
      Object.assign(client, clientData);
      await client.save();
    }

    // Save message
    const messageData = {
      messageId: message.message_id.toString(),
      clientId: client._id,
      type: getMessageType(message),
      content: getMessageContent(message),
      direction: 'incoming',
      timestamp: new Date(message.date * 1000)
    };

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Handle bot commands and responses
    await handleBotLogic(message, client);

  } catch (error) {
    console.error('Error handling Telegram update:', error);
  }
}

function getMessageType(message) {
  if (message.text && message.text.startsWith('/')) return 'command';
  if (message.text) return 'text';
  if (message.photo) return 'photo';
  if (message.sticker) return 'sticker';
  if (message.document) return 'document';
  if (message.voice) return 'voice';
  if (message.video) return 'video';
  if (message.location) return 'location';
  if (message.contact) return 'contact';
  return 'text';
}

function getMessageContent(message) {
  if (message.text) return message.text;
  if (message.photo) return 'Photo';
  if (message.sticker) return 'Sticker';
  if (message.document) return message.document.file_name || 'Document';
  if (message.voice) return 'Voice message';
  if (message.video) return 'Video';
  if (message.location) return `Location: ${message.location.latitude}, ${message.location.longitude}`;
  if (message.contact) return `Contact: ${message.contact.first_name} ${message.contact.phone_number}`;
  return 'Unknown message type';
}

async function handleBotLogic(message, client) {
  const text = message.text;
  const chatId = message.chat.id;

  try {
    if (text === '/start') {
      await showStoreMenu(chatId, client.firstName);
    } else if (text === '/help') {
      await sendMessage(chatId, `Доступные команды:\n\n/start - Главное меню магазинов\n/help - Показать эту справку\n\nВыберите магазин из меню или отправьте промокод для проверки!`);
    } else if (text && text.startsWith('/copy_')) {
      await handleCopyCommand(chatId, text);
    } else if (text && text.startsWith('/')) {
      await sendMessage(chatId, 'Неизвестная команда. Используй /help для списка команд.');
    } else if (isStoreSelection(text)) {
      await showStorePromos(chatId, text);
    } else if (text) {
      // Check if message is a promo code
      await checkPromoCode(chatId, text.toUpperCase(), client);
    }
  } catch (error) {
    console.error('Error in bot logic:', error);
    await sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
}

async function showStoreMenu(chatId, firstName) {
  const menuText = `Привет, ${firstName}! 👋

🛍️ Выберите магазин для просмотра активных промокодов:

🛒 Вайлдберриз
🛍️ Озон
📱 М.Видео
💻 ДНС
🛍️ Пятёрочка

Просто отправьте название магазина или нажмите на кнопку ниже:`;

  const keyboard = {
    keyboard: [
      ['🛒 Вайлдберриз', '🛍️ Озон'],
      ['📱 М.Видео', '💻 ДНС'],
      ['🛍️ Пятёрочка']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };

  await sendMessage(chatId, menuText, { reply_markup: keyboard });
}

async function handleCopyCommand(chatId, command) {
  // Extract promo code from /copy_PROMOCODE format
  const promoCode = command.replace('/copy_', '');
  
  if (promoCode) {
    await sendMessage(chatId, promoCode);
  } else {
    await sendMessage(chatId, 'Ошибка в команде копирования.');
  }
}

function isStoreSelection(text) {
  const stores = [
    '🛒 Вайлдберриз', 'Вайлдберриз', 'вайлдберриз', 'wildberries',
    '🛍️ Озон', 'Озон', 'озон', 'ozon',
    '📱 М.Видео', 'М.Видео', 'м.видео', 'мвидео', 'mvideo',
    '💻 ДНС', 'ДНС', 'днс', 'dns',
    '🛍️ Пятёрочка', 'Пятёрочка', 'пятёрочка', 'pyaterochka'
  ];
  return stores.some(store => text.toLowerCase().includes(store.toLowerCase().replace(/[🛒🛍️📱💻]/g, '').trim()));
}

function getStoreNameFromText(text) {
  const storeMap = {
    'вайлдберриз': 'Вайлдберриз',
    'wildberries': 'Вайлдберриз',
    'озон': 'Озон',
    'ozon': 'Озон',
    'м.видео': 'М.Видео',
    'мвидео': 'М.Видео',
    'mvideo': 'М.Видео',
    'днс': 'ДНС',
    'dns': 'ДНС',
    'пятёрочка': 'Пятёрочка',
    'pyaterochka': 'Пятёрочка'
  };

  const cleanText = text.toLowerCase().replace(/[🛒🛍️📱💻]/g, '').trim();
  
  for (const [key, value] of Object.entries(storeMap)) {
    if (cleanText.includes(key)) {
      return value;
    }
  }
  return cleanText;
}

async function showStorePromos(chatId, storeText) {
  try {
    const storeName = getStoreNameFromText(storeText);
    
    const promos = await Promo.find({ 
      store: { $regex: storeName, $options: 'i' },
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (promos.length === 0) {
      await sendMessage(chatId, `😔 К сожалению, активных промокодов для ${storeName} сейчас нет.\n\n/start - Вернуться к выбору магазинов`);
      return;
    }

    let messageText = `🛍️ Активные промокоды ${storeName}:\n\n`;
    
    promos.forEach((promo, index) => {
      const expiryDate = new Date(promo.expiresAt).toLocaleDateString('ru-RU');
      messageText += `💳 ${promo.code}\n`;
      messageText += `🎁 ${promo.discount}\n`;
      messageText += `💰 Минимальная сумма: ${promo.minPrice}₽\n`;
      messageText += `📍 Регионы: ${promo.locations.join(', ')}\n`;
      messageText += `⏰ Действует до: ${expiryDate}\n`;
      messageText += `📋 /copy_${promo.code} - Копировать код\n`;
      if (index < promos.length - 1) messageText += '\n';
    });

    messageText += `\n/start - Выбрать другой магазин`;

    await sendMessage(chatId, messageText);
  } catch (error) {
    console.error('Error showing store promos:', error);
    await sendMessage(chatId, 'Ошибка при получении промокодов. Попробуйте позже.');
  }
}


async function checkPromoCode(chatId, code, client) {
  try {
    const promo = await Promo.findOne({ 
      code: code, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    let responseText;
    if (promo) {
      responseText = `✅ Промокод найден!\n\n` +
        `💳 ${promo.code}\n` +
        `🎁 ${promo.discount}\n` +
        `💰 Минимальная сумма: ${promo.minPrice}₽\n` +
        `🏪 Магазин: ${promo.store}\n` +
        `📍 Локации: ${promo.locations.join(', ')}\n` +
        `⏰ Действует до: ${promo.expiresAt.toLocaleDateString('ru-RU')}\n\n` +
        `📋 /copy_${promo.code} - Копировать код`;
    } else {
      responseText = `❌ Промокод "${code}" не найден или истек срок действия.`;
    }

    await sendMessage(chatId, responseText);
  } catch (error) {
    console.error('Error checking promo code:', error);
    await sendMessage(chatId, 'Ошибка при проверке промокода. Попробуйте позже.');
  }
}

export async function sendMessage(chatId, text, options = {}) {
  if (!bot) {
    console.error('Bot not initialized - missing BOT_TOKEN');
    return;
  }

  try {
    const sentMessage = await bot.sendMessage(chatId, text, options);
    
    // Save outgoing message to database
    await connectDB();
    const client = await Client.findOne({ telegramId: chatId.toString() });
    
    if (client) {
      const messageData = {
        messageId: sentMessage.message_id.toString(),
        clientId: client._id,
        type: 'text',
        content: text,
        direction: 'outgoing',
        timestamp: new Date(sentMessage.date * 1000)
      };

      const newMessage = new Message(messageData);
      await newMessage.save();
    }

    return sentMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export { bot };
