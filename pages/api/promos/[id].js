import connectDB from '../../../lib/mongodb';
import Promo from '../../../models/Promo';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const promo = await Promo.findById(id);
        
        if (!promo) {
          return res.status(404).json({ error: 'Promo not found' });
        }

        res.status(200).json({
          success: true,
          data: promo
        });
      } catch (error) {
        console.error('Get promo error:', error);
        res.status(500).json({ error: 'Failed to fetch promo' });
      }
      break;

    case 'PUT':
      try {
        const { code, minPrice, expiresAt, locations, store, isActive } = req.body;

        const updateData = {};
        if (code) updateData.code = code.toUpperCase();
        if (minPrice !== undefined) updateData.minPrice = minPrice;
        if (expiresAt) updateData.expiresAt = new Date(expiresAt);
        if (locations) updateData.locations = Array.isArray(locations) ? locations : [locations];
        if (store) updateData.store = store;
        if (isActive !== undefined) updateData.isActive = isActive;

        const promo = await Promo.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!promo) {
          return res.status(404).json({ error: 'Promo not found' });
        }

        res.status(200).json({
          success: true,
          data: promo
        });
      } catch (error) {
        console.error('Update promo error:', error);
        if (error.code === 11000) {
          res.status(400).json({ error: 'Promo code already exists' });
        } else {
          res.status(500).json({ error: 'Failed to update promo' });
        }
      }
      break;

    case 'DELETE':
      try {
        const promo = await Promo.findByIdAndDelete(id);

        if (!promo) {
          return res.status(404).json({ error: 'Promo not found' });
        }

        res.status(200).json({
          success: true,
          message: 'Promo deleted successfully'
        });
      } catch (error) {
        console.error('Delete promo error:', error);
        res.status(500).json({ error: 'Failed to delete promo' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

export default requireAuth(handler);
