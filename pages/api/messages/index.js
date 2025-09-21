import connectDB from '../../../lib/mongodb';
import Message from '../../../models/Message';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const { page = 1, limit = 20, clientId, type, direction } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (clientId) query.clientId = clientId;
        if (type) query.type = type;
        if (direction) query.direction = direction;

        const messages = await Message.find(query)
          .populate('clientId', 'firstName lastName username telegramId')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        const total = await Message.countDocuments(query);

        res.status(200).json({
          success: true,
          data: messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
