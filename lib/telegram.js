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
    // Check if user hasn't selected a language yet
    if (!client.languageSelected) {
      if (text === '/start') {
        await showLanguageSelection(chatId);
        return;
      } else if (isLanguageSelection(text)) {
        await handleLanguageSelection(chatId, text, client);
        return;
      } else {
        await showLanguageSelection(chatId);
        return;
      }
    }

    // Normal bot logic for users who have selected a language
    if (text === '/start') {
      await showStoreMenu(chatId, client.firstName, client.language);
    } else if (text === '/help') {
      await sendMessage(chatId, getHelpMessage(client.language));
    } else if (text === '/language' || text === '/lang') {
      await showLanguageSelection(chatId);
    } else if (isLanguageSelection(text)) {
      await handleLanguageSelection(chatId, text, client);
    } else if (text && text.startsWith('/copy_')) {
      await handleCopyCommand(chatId, text, client.language);
    } else if (text && text.startsWith('/')) {
      await sendMessage(chatId, getUnknownCommandMessage(client.language));
    } else if (isStoreSelection(text)) {
      await showStorePromos(chatId, text, client.language);
    } else if (text) {
      // Check if message is a promo code
      await checkPromoCode(chatId, text.toUpperCase(), client);
    }
  } catch (error) {
    console.error('Error in bot logic:', error);
    await sendMessage(chatId, getErrorMessage(client.language));
  }
}

// Language selection functions
async function showLanguageSelection(chatId) {
  const menuText = `Please choose your language / Пожалуйста, выберите язык / يرجى اختيار لغتك:

🇬🇧 English
🇷🇺 Русский  
🇸🇦 العربية

Simply type the language name or click on the button below.`;

  const keyboard = {
    keyboard: [
      ['🇬🇧 English'],
      ['🇷🇺 Русский'],
      ['🇸🇦 العربية']
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };

  await sendMessage(chatId, menuText, { reply_markup: keyboard });
}

function isLanguageSelection(text) {
  const languages = [
    '🇬🇧 English', 'English', 'english', 'en',
    '🇷🇺 Русский', 'Русский', 'русский', 'Russian', 'russian', 'ru',
    '🇸🇦 العربية', 'العربية', 'Arabic', 'arabic', 'ar'
  ];
  return languages.some(lang => text.toLowerCase().includes(lang.toLowerCase()));
}

function getLanguageCode(text) {
  const cleanText = text.toLowerCase();
  if (cleanText.includes('english') || cleanText.includes('en')) return 'en';
  if (cleanText.includes('русский') || cleanText.includes('russian') || cleanText.includes('ru')) return 'ru';
  if (cleanText.includes('العربية') || cleanText.includes('arabic') || cleanText.includes('ar')) return 'ar';
  return 'en'; // default
}

async function handleLanguageSelection(chatId, text, client) {
  const selectedLanguage = getLanguageCode(text);
  
  // Update client language preference
  client.language = selectedLanguage;
  client.languageSelected = true;
  await client.save();

  // Send confirmation message
  const confirmationMessage = getLanguageConfirmationMessage(selectedLanguage);
  await sendMessage(chatId, confirmationMessage);

  // Show the main store menu
  await showStoreMenu(chatId, client.firstName, selectedLanguage);
}

// Multilingual message functions
function getLanguageConfirmationMessage(language) {
  const messages = {
    en: '✅ Language set to English! Welcome to the promo codes bot.',
    ru: '✅ Язык установлен на русский! Добро пожаловать в бот промокодов.',
    ar: '✅ تم تعيين اللغة إلى العربية! مرحباً بك في بوت رموز الخصم.'
  };
  return messages[language] || messages.en;
}

function getHelpMessage(language) {
  const messages = {
    en: `Available commands:\n\n/start - Main store menu\n/help - Show this help\n/language - Change language\n\nSelect a store from the menu or send a promo code to check!`,
    ru: `Доступные команды:\n\n/start - Главное меню магазинов\n/help - Показать эту справку\n/language - Изменить язык\n\nВыберите магазин из меню или отправьте промокод для проверки!`,
    ar: `الأوامر المتاحة:\n\n/start - قائمة المتاجر الرئيسية\n/help - عرض هذه المساعدة\n/language - تغيير اللغة\n\nاختر متجراً من القائمة أو أرسل رمز خصم للتحقق!`
  };
  return messages[language] || messages.en;
}

function getUnknownCommandMessage(language) {
  const messages = {
    en: 'Unknown command. Use /help for list of commands.',
    ru: 'Неизвестная команда. Используй /help для списка команд.',
    ar: 'أمر غير معروف. استخدم /help لقائمة الأوامر.'
  };
  return messages[language] || messages.en;
}

function getErrorMessage(language) {
  const messages = {
    en: 'An error occurred. Please try again later.',
    ru: 'Произошла ошибка. Попробуйте позже.',
    ar: 'حدث خطأ. يرجى المحاولة لاحقاً.'
  };
  return messages[language] || messages.en;
}

async function showStoreMenu(chatId, firstName, language = 'ru') {
  const menuText = getStoreMenuMessage(firstName, language);
  const keyboard = getStoreMenuKeyboard(language);

  await sendMessage(chatId, menuText, { reply_markup: keyboard });
}

function getStoreMenuMessage(firstName, language) {
  const messages = {
    en: `Hello, ${firstName}! 👋

🛍️ Choose a store to view active promo codes:

🛒 Wildberries
🛍️ Ozon
📱 M.Video
💻 DNS
🛍️ Pyaterochka

Just send the store name or tap on a button below:`,
    ru: `Привет, ${firstName}! 👋

🛍️ Выберите магазин для просмотра активных промокодов:

🛒 Вайлдберриз
🛍️ Озон
📱 М.Видео
💻 ДНС
🛍️ Пятёрочка

Просто отправьте название магазина или нажмите на кнопку ниже:`,
    ar: `مرحباً، ${firstName}! 👋

🛍️ اختر متجراً لعرض رموز الخصم النشطة:

🛒 وايلدبيريز
🛍️ أوزون
📱 إم.فيديو
💻 دي إن إس
🛍️ بياتيروتشكا

فقط أرسل اسم المتجر أو اضغط على الزر أدناه:`
  };
  return messages[language] || messages.ru;
}

function getStoreMenuKeyboard(language) {
  const keyboards = {
    en: {
      keyboard: [
        ['🛒 Wildberries', '🛍️ Ozon'],
        ['📱 M.Video', '💻 DNS'],
        ['🛍️ Pyaterochka']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    },
    ru: {
      keyboard: [
        ['🛒 Вайлдберриз', '🛍️ Озон'],
        ['📱 М.Видео', '💻 ДНС'],
        ['🛍️ Пятёрочка']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    },
    ar: {
      keyboard: [
        ['🛒 وايلدبيريز', '🛍️ أوزون'],
        ['📱 إم.فيديو', '💻 دي إن إس'],
        ['🛍️ بياتيروتشكا']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
  return keyboards[language] || keyboards.ru;
}

async function handleCopyCommand(chatId, command, language = 'ru') {
  // Extract promo code from /copy_PROMOCODE format
  const promoCode = command.replace('/copy_', '');
  
  if (promoCode) {
    await sendMessage(chatId, promoCode);
  } else {
    const errorMessage = getCopyErrorMessage(language);
    await sendMessage(chatId, errorMessage);
  }
}

function getCopyErrorMessage(language) {
  const messages = {
    en: 'Error in copy command.',
    ru: 'Ошибка в команде копирования.',
    ar: 'خطأ في أمر النسخ.'
  };
  return messages[language] || messages.ru;
}

function isStoreSelection(text) {
  const stores = [
    // Russian names
    '🛒 Вайлдберриз', 'Вайлдберриз', 'вайлдберриз', 
    '🛍️ Озон', 'Озон', 'озон',
    '📱 М.Видео', 'М.Видео', 'м.видео', 'мвидео',
    '💻 ДНС', 'ДНС', 'днс',
    '🛍️ Пятёрочка', 'Пятёрочка', 'пятёрочка',
    // English names
    '🛒 Wildberries', 'Wildberries', 'wildberries',
    '🛍️ Ozon', 'Ozon', 'ozon',
    '📱 M.Video', 'M.Video', 'mvideo',
    '💻 DNS', 'DNS', 'dns',
    '🛍️ Pyaterochka', 'Pyaterochka', 'pyaterochka',
    // Arabic names
    '🛒 وايلدبيريز', 'وايلدبيريز',
    '🛍️ أوزون', 'أوزون',
    '📱 إم.فيديو', 'إم.فيديو',
    '💻 دي إن إس', 'دي إن إس',
    '🛍️ بياتيروتشكا', 'بياتيروتشكا'
  ];
  return stores.some(store => text.toLowerCase().includes(store.toLowerCase().replace(/[🛒🛍️📱💻]/g, '').trim()));
}

function getStoreNameFromText(text) {
  const storeMap = {
    // Russian names
    'вайлдберриз': 'Вайлдберриз',
    'озон': 'Озон',
    'м.видео': 'М.Видео',
    'мвидео': 'М.Видео',
    'днс': 'ДНС',
    'пятёрочка': 'Пятёрочка',
    // English names
    'wildberries': 'Вайлдберриз',
    'ozon': 'Озон',
    'mvideo': 'М.Видео',
    'm.video': 'М.Видео',
    'dns': 'ДНС',
    'pyaterochka': 'Пятёрочка',
    // Arabic names
    'وايلدبيريز': 'Вайлдберриз',
    'أوزون': 'Озон',
    'إم.فيديو': 'М.Видео',
    'دي إن إس': 'ДНС',
    'بياتيروتشكا': 'Пятёрочка'
  };

  const cleanText = text.toLowerCase().replace(/[🛒🛍️📱💻]/g, '').trim();
  
  for (const [key, value] of Object.entries(storeMap)) {
    if (cleanText.includes(key)) {
      return value;
    }
  }
  return cleanText;
}

async function showStorePromos(chatId, storeText, language = 'ru') {
  try {
    const storeName = getStoreNameFromText(storeText);
    
    const promos = await Promo.find({ 
      store: { $regex: storeName, $options: 'i' },
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (promos.length === 0) {
      const noPromosMessage = getNoPromosMessage(storeName, language);
      await sendMessage(chatId, noPromosMessage);
      return;
    }

    let messageText = getPromosHeaderMessage(storeName, language);
    
    promos.forEach((promo, index) => {
      const expiryDate = new Date(promo.expiresAt).toLocaleDateString(getLocale(language));
      messageText += getPromoDetailsMessage(promo, expiryDate, language);
      if (index < promos.length - 1) messageText += '\n';
    });

    messageText += getBackToStoresMessage(language);

    await sendMessage(chatId, messageText);
  } catch (error) {
    console.error('Error showing store promos:', error);
    const errorMessage = getPromosErrorMessage(language);
    await sendMessage(chatId, errorMessage);
  }
}

function getNoPromosMessage(storeName, language) {
  const messages = {
    en: `😔 Unfortunately, there are no active promo codes for ${storeName} right now.\n\n/start - Back to store selection`,
    ru: `😔 К сожалению, активных промокодов для ${storeName} сейчас нет.\n\n/start - Вернуться к выбору магазинов`,
    ar: `😔 للأسف، لا توجد رموز خصم نشطة لـ ${storeName} الآن.\n\n/start - العودة إلى اختيار المتاجر`
  };
  return messages[language] || messages.ru;
}

function getPromosHeaderMessage(storeName, language) {
  const messages = {
    en: `🛍️ Active promo codes for ${storeName}:\n\n`,
    ru: `🛍️ Активные промокоды ${storeName}:\n\n`,
    ar: `🛍️ رموز الخصم النشطة لـ ${storeName}:\n\n`
  };
  return messages[language] || messages.ru;
}

function getPromoDetailsMessage(promo, expiryDate, language) {
  const labels = {
    en: {
      discount: '🎁',
      minPrice: '💰 Minimum amount:',
      regions: '📍 Regions:',
      validUntil: '⏰ Valid until:',
      copy: '📋 /copy_'
    },
    ru: {
      discount: '🎁',
      minPrice: '💰 Минимальная сумма:',
      regions: '📍 Регионы:',
      validUntil: '⏰ Действует до:',
      copy: '📋 /copy_'
    },
    ar: {
      discount: '🎁',
      minPrice: '💰 الحد الأدنى للمبلغ:',
      regions: '📍 المناطق:',
      validUntil: '⏰ صالح حتى:',
      copy: '📋 /copy_'
    }
  };
  
  const label = labels[language] || labels.ru;
  const currency = language === 'ar' ? 'ريال' : '₽';
  const copyText = language === 'en' ? ' - Copy code' : (language === 'ru' ? ' - Копировать код' : ' - نسخ الرمز');
  
  return `💳 ${promo.code}\n` +
         `${label.discount} ${promo.discount}\n` +
         `${label.minPrice} ${promo.minPrice}${currency}\n` +
         `${label.regions} ${promo.locations.join(', ')}\n` +
         `${label.validUntil} ${expiryDate}\n` +
         `${label.copy}${promo.code}${copyText}\n`;
}

function getBackToStoresMessage(language) {
  const messages = {
    en: `\n/start - Select another store`,
    ru: `\n/start - Выбрать другой магазин`,
    ar: `\n/start - اختيار متجر آخر`
  };
  return messages[language] || messages.ru;
}

function getPromosErrorMessage(language) {
  const messages = {
    en: 'Error getting promo codes. Please try later.',
    ru: 'Ошибка при получении промокодов. Попробуйте позже.',
    ar: 'خطأ في الحصول على رموز الخصم. يرجى المحاولة لاحقاً.'
  };
  return messages[language] || messages.ru;
}

function getLocale(language) {
  const locales = {
    en: 'en-US',
    ru: 'ru-RU',
    ar: 'ar-SA'
  };
  return locales[language] || 'ru-RU';
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
      responseText = getPromoFoundMessage(promo, client.language);
    } else {
      responseText = getPromoNotFoundMessage(code, client.language);
    }

    await sendMessage(chatId, responseText);
  } catch (error) {
    console.error('Error checking promo code:', error);
    const errorMessage = getPromoCheckErrorMessage(client.language);
    await sendMessage(chatId, errorMessage);
  }
}

function getPromoFoundMessage(promo, language) {
  const expiryDate = promo.expiresAt.toLocaleDateString(getLocale(language));
  const currency = language === 'ar' ? 'ريال' : '₽';
  
  const labels = {
    en: {
      found: '✅ Promo code found!',
      minPrice: '💰 Minimum amount:',
      store: '🏪 Store:',
      locations: '📍 Locations:',
      validUntil: '⏰ Valid until:',
      copy: '📋 /copy_'
    },
    ru: {
      found: '✅ Промокод найден!',
      minPrice: '💰 Минимальная сумма:',
      store: '🏪 Магазин:',
      locations: '📍 Локации:',
      validUntil: '⏰ Действует до:',
      copy: '📋 /copy_'
    },
    ar: {
      found: '✅ تم العثور على رمز الخصم!',
      minPrice: '💰 الحد الأدنى للمبلغ:',
      store: '🏪 المتجر:',
      locations: '📍 المواقع:',
      validUntil: '⏰ صالح حتى:',
      copy: '📋 /copy_'
    }
  };
  
  const label = labels[language] || labels.ru;
  const copyText = language === 'en' ? ' - Copy code' : (language === 'ru' ? ' - Копировать код' : ' - نسخ الرمز');
  
  return `${label.found}\n\n` +
         `💳 ${promo.code}\n` +
         `🎁 ${promo.discount}\n` +
         `${label.minPrice} ${promo.minPrice}${currency}\n` +
         `${label.store} ${promo.store}\n` +
         `${label.locations} ${promo.locations.join(', ')}\n` +
         `${label.validUntil} ${expiryDate}\n\n` +
         `${label.copy}${promo.code}${copyText}`;
}

function getPromoNotFoundMessage(code, language) {
  const messages = {
    en: `❌ Promo code "${code}" not found or expired.`,
    ru: `❌ Промокод "${code}" не найден или истек срок действия.`,
    ar: `❌ رمز الخصم "${code}" غير موجود أو منتهي الصلاحية.`
  };
  return messages[language] || messages.ru;
}

function getPromoCheckErrorMessage(language) {
  const messages = {
    en: 'Error checking promo code. Please try later.',
    ru: 'Ошибка при проверке промокода. Попробуйте позже.',
    ar: 'خطأ في التحقق من رمز الخصم. يرجى المحاولة لاحقاً.'
  };
  return messages[language] || messages.ru;
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
