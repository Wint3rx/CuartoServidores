import { Router } from 'express';
import pool from '../db.js';
import { deviceAuth } from '../middleware/deviceAuth.js';

const router = Router();

// POST /api/lecturas  (lo llama el ESP32)
// Body: { "temperatura": 24.3, "humedad": 45.1 }
router.post('/', deviceAuth, async (req, res) => {
  // En Express 5, req.body es undefined si la peticion no trae cuerpo
  const { temperatura, humedad } = req.body ?? {};
  const t = Number(temperatura);
  const h = Number(humedad);

  if (!Number.isFinite(t) || t < -40 || t > 80) {
    return res.status(400).json({ error: 'temperatura invalida' });
  }
  if (!Number.isFinite(h) || h < 0 || h > 100) {
    return res.status(400).json({ error: 'humedad invalida' });
  }

  const [result] = await pool.query(
    'INSERT INTO lecturas (dispositivo_id, temperatura, humedad) VALUES (?, ?, ?)',
    [req.device.id, t, h]
  );

  const lectura = {
    id: result.insertId,
    dispositivo: req.device.nombre,
    temperatura: t,
    humedad: h,
    fecha_hora: new Date().toISOString(),
  };

  // Empuja la lectura en vivo al panel
  req.app.get('io').emit('lectura', lectura);

  res.status(201).json(lectura);
});

// GET /api/lecturas?limit=60  (lo usara el panel; mas adelante se protege con JWT)
router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 1000);
  const [rows] = await pool.query(
    `SELECT l.id, d.nombre AS dispositivo, l.temperatura, l.humedad, l.fecha_hora
       FROM lecturas l
       JOIN dispositivos d ON d.id = l.dispositivo_id
      ORDER BY l.fecha_hora DESC
      LIMIT ?`,
    [limit]
  );
  res.json(rows);
});

export default router;
