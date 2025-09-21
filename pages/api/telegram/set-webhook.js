import { bot } from '../../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'TELEGRAM_WEBHOOK_URL not configured' });
    }

    if (!bot) {
      return res.status(400).json({ error: 'Bot not initialized - check TELEGRAM_BOT_TOKEN' });
    }

    await bot.setWebHook(webhookUrl);
    
    res.status(200).json({ 
      success: true, 
      message: 'Webhook set successfully',
      webhookUrl 
    });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({ error: 'Failed to set webhook' });
  }
}
