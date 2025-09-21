import connectDB from '../../../lib/mongodb';
import Client from '../../../models/Client';
import Message from '../../../models/Message';
import Promo from '../../../models/Promo';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get counts
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ isActive: true });
    const totalPromos = await Promo.countDocuments();
    const activePromos = await Promo.countDocuments({ 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    const totalMessages = await Message.countDocuments();

    // Get recent activity
    const recentClients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName username telegramId createdAt');

    const recentMessages = await Message.find()
      .populate('clientId', 'firstName lastName username')
      .sort({ timestamp: -1 })
      .limit(10);

    // Get message stats by type
    const messageStats = await Message.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily message counts for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyMessages = await Message.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          totalClients,
          activeClients,
          totalPromos,
          activePromos,
          totalMessages
        },
        recentActivity: {
          clients: recentClients,
          messages: recentMessages
        },
        charts: {
          messageStats,
          dailyMessages
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

export default requireAuth(handler);
