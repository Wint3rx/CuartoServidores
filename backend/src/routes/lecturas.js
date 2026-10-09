import { Router } from 'express';
import pool from '../db.js';
import { deviceAuth } from '../middleware/deviceAuth.js';

const router = Router();

// POST /api/lecturas (lo llama el ESP32)
// Body: { "temperatura": 24.3, "humedad": 45.1 }
router.post('/', deviceAuth, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error al guardar lectura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/lecturas/temperatura/historico?rango=24h (Para la sección de Temperatura)
router.get('/temperatura/historico', async (req, res) => {
  try {
    const { rango = '24h' } = req.query;

    let horasIntervalo = 24;
    if (rango === '7d') horasIntervalo = 168;   // 7 * 24h
    if (rango === '30d') horasIntervalo = 720;  // 30 * 24h

    // Consulta MySQL adaptada a tu esquema
    const [rows] = await pool.query(
      `SELECT
         l.id AS id_lectura,
         d.nombre AS dispositivo,
         l.temperatura,
         l.fecha_hora,
         CASE
           WHEN l.temperatura >= 28 THEN 'Crítico'
           WHEN l.temperatura >= 24 THEN 'Advertencia'
           ELSE 'Normal'
         END AS estado
       FROM lecturas l
       JOIN dispositivos d ON d.id = l.dispositivo_id
       WHERE l.fecha_hora >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY l.fecha_hora DESC`,
      [horasIntervalo]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener histórico de temperatura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/lecturas?limit=60 (lo usara el panel; mas adelante se protege con JWT)
router.get('/', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error al obtener lecturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
