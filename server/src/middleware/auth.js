import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET || 'glug-secret-key-development';
  const id = user.id || user._id?.toString();
  return jwt.sign(
    { id, username: user.username, role: user.role || 'student' },
    secret,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const secret = process.env.JWT_SECRET || 'glug-secret-key-development';
  try {
    const decoded = jwt.verify(header.slice(7), secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const secret = process.env.JWT_SECRET || 'glug-secret-key-development';
    try {
      req.user = jwt.verify(header.slice(7), secret);
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

