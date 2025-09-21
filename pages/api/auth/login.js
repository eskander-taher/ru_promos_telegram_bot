import { isValidAdmin, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidAdmin(email, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ email, role: 'admin' });

    res.status(200).json({
      success: true,
      token,
      user: { email, role: 'admin' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
