import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/temperatura', async (req, res) => {
  try {
    const [porDia] = await pool.query(
      `SELECT 
         DATE(fecha_hora) as fecha,
         ROUND(AVG(temperatura), 1) as temp_promedio,
         ROUND(MIN(temperatura), 1) as temp_min,
         ROUND(MAX(temperatura), 1) as temp_max,
         COUNT(*) as lecturas
       FROM lecturas
       WHERE fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(fecha_hora)
       ORDER BY fecha DESC`
    );

    const [porHora] = await pool.query(
      `SELECT 
         DATE(fecha_hora) as fecha,
         HOUR(fecha_hora) as hora,
         ROUND(AVG(temperatura), 1) as temp_promedio,
         ROUND(MIN(temperatura), 1) as temp_min,
         ROUND(MAX(temperatura), 1) as temp_max,
         COUNT(*) as lecturas
       FROM lecturas
       WHERE fecha_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(fecha_hora), HOUR(fecha_hora)
       ORDER BY fecha DESC, hora DESC`
    );

    res.json({ porDia, porHora });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/resumen', async (req, res) => {
  try {
    const [tempActual] = await pool.query(
      `SELECT temperatura, humedad, fecha_hora, d.nombre as dispositivo
       FROM lecturas l
       JOIN dispositivos d ON d.id = l.dispositivo_id
       ORDER BY fecha_hora DESC
       LIMIT 1`
    );

    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) as total_lecturas,
         ROUND(AVG(temperatura), 1) as temp_promedio,
         ROUND(MAX(temperatura), 1) as temp_max,
         ROUND(MIN(temperatura), 1) as temp_min
       FROM lecturas
       WHERE fecha_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    res.json({
      actual: tempActual[0] || null,
      ultimas24h: stats[0] || {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
