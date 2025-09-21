import connectDB from '../../../lib/mongodb';
import Client from '../../../models/Client';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = search 
          ? { 
              $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { telegramId: { $regex: search, $options: 'i' } }
              ]
            }
          : {};

        const clients = await Client.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        const total = await Client.countDocuments(query);

        res.status(200).json({
          success: true,
          data: clients,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
