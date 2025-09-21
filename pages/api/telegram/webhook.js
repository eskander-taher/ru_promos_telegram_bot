import { handleTelegramUpdate } from '../../../lib/telegram';

export default async function handler(req, res) {
  console.log('🔥 Webhook received:', req.method, new Date().toISOString());
  
  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('📨 Update received:', JSON.stringify(update, null, 2));
    
    // Handle the Telegram update
    await handleTelegramUpdate(update);
    
    console.log('✅ Update processed successfully');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
