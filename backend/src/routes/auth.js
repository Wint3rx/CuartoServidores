import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { config } from '../config.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, email, nombre, password_hash FROM administradores WHERE email = ?',
      [email]
    );

    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, nombre: admin.nombre, rol: 'admin' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: admin.id, email: admin.email, nombre: admin.nombre, rol: 'admin' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
