import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
