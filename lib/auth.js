import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

export function generateToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		return null;
	}
}

export async function hashPassword(password) {
	return await bcrypt.hash(password, 12);
}

export async function comparePassword(password, hashedPassword) {
	return await bcrypt.compare(password, hashedPassword);
}

export function isValidAdmin(email, password) {
  if (!email || !password) return false;
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;

	return email === adminEmail && password === adminPassword;
}

export function requireAuth(handler) {
	return async (req, res) => {
		try {
			const token = req.headers.authorization?.replace("Bearer ", "");

			if (!token) {
				return res.status(401).json({ error: "No token provided" });
			}

			const decoded = verifyToken(token);
			if (!decoded) {
				return res.status(401).json({ error: "Invalid token" });
			}

			req.user = decoded;
			return handler(req, res);
		} catch (error) {
			return res.status(401).json({ error: "Authentication failed" });
		}
	};
}
