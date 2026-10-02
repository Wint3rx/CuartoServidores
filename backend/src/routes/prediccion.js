import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

function calculatePrediction(lecturas) {
  if (lecturas.length === 0) {
    const baseTemps = [23, 24, 24, 23, 22, 21, 21, 22, 23, 24, 25, 26, 27, 28, 28, 27, 26, 25, 24, 23, 23, 22, 22, 23];
    return baseTemps.map((temp, hour) => ({
      hora: `${String(hour).padStart(2, '0')}:00`,
      temperatura_esperada: Number(temp.toFixed(1)),
      alerta: temp >= 27
    }));
  }

  const tempsPorHora = Array(24).fill().map(() => ({ sum: 0, count: 0 }));

  lecturas.forEach(lectura => {
    const fecha = new Date(lectura.fecha_hora);
    const hora = fecha.getUTCHours(); // Datos en UTC
    tempsPorHora[hora].sum += parseFloat(lectura.temperatura);
    tempsPorHora[hora].count += 1;
  });

  const promedios = tempsPorHora.map((h, i) => {
    if (h.count === 0) {
      return { hora: i, temp: 24.0 };
    }
    return { hora: i, temp: h.sum / h.count };
  });

  const ultimas = lecturas.slice(0, 50);
  let tendencia = 0;
  if (ultimas.length >= 2) {
    const primera = parseFloat(ultimas[ultimas.length - 1].temperatura);
    const ultima = parseFloat(ultimas[0].temperatura);
    tendencia = (ultima - primera) / Math.max(ultimas.length, 1) * 0.1;
  }

  return promedios.map(({ hora, temp }) => {
    const tempPredicha = Math.max(15, Math.min(40, temp + tendencia));
    return {
      hora: `${String(hora).padStart(2, '0')}:00`,
      temperatura_esperada: Number(tempPredicha.toFixed(1)),
      alerta: tempPredicha >= 27
    };
  });
}

router.get('/', async (req, res) => {
  try {
    const [lecturas] = await pool.query(
      `SELECT temperatura, fecha_hora
       FROM lecturas
       WHERE fecha_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY fecha_hora ASC`
    );

    const prediccion = calculatePrediction(lecturas);

    res.json({
      periodo: 'próximas 24 horas',
      basado_en_dias: 7,
      predicciones: prediccion,
      umbral_alerta: 27.0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
