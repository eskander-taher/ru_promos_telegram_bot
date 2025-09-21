import connectDB from '../../../lib/mongodb';
import Promo from '../../../models/Promo';
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
                { code: { $regex: search, $options: 'i' } },
                { store: { $regex: search, $options: 'i' } }
              ]
            }
          : {};

        const promos = await Promo.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        const total = await Promo.countDocuments(query);

        res.status(200).json({
          success: true,
          data: promos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get promos error:', error);
        res.status(500).json({ error: 'Failed to fetch promos' });
      }
      break;

    case 'POST':
      try {
        const { code, minPrice, expiresAt, locations, store } = req.body;

        if (!code || !minPrice || !expiresAt || !locations || !store) {
          return res.status(400).json({ error: 'All fields are required' });
        }

        const promo = new Promo({
          code: code.toUpperCase(),
          minPrice,
          expiresAt: new Date(expiresAt),
          locations: Array.isArray(locations) ? locations : [locations],
          store
        });

        await promo.save();

        res.status(201).json({
          success: true,
          data: promo
        });
      } catch (error) {
        console.error('Create promo error:', error);
        if (error.code === 11000) {
          res.status(400).json({ error: 'Promo code already exists' });
        } else {
          res.status(500).json({ error: 'Failed to create promo' });
        }
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
