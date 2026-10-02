import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ingreso-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         i.id,
         i.usuario_id,
         u.nombre as usuario_nombre,
         i.imagen_path,
         i.imagen_url,
         i.hora_exacta,
         i.fecha_hora,
         i.observaciones
       FROM ingresos i
       LEFT JOIN usuarios u ON u.id = i.usuario_id
       ORDER BY i.fecha_hora DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { usuario_id, observaciones } = req.body ?? {};
    const usuarioId = usuario_id ? parseInt(usuario_id) : null;
    
    let imagenPath = null;
    let imagenUrl = null;
    if (req.file) {
      imagenPath = req.file.path;
      imagenUrl = `/uploads/${req.file.filename}`;
    }

    const horaExacta = new Date().toISOString();

    const [result] = await pool.query(
      `INSERT INTO ingresos (usuario_id, imagen_path, imagen_url, hora_exacta, fecha_hora, observaciones)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [usuarioId, imagenPath, imagenUrl, horaExacta, observaciones || null]
    );

    const [ingreso] = await pool.query(
      `SELECT 
         i.id,
         i.usuario_id,
         u.nombre as usuario_nombre,
         i.imagen_path,
         i.imagen_url,
         i.hora_exacta,
         i.fecha_hora,
         i.observaciones
       FROM ingresos i
       LEFT JOIN usuarios u ON u.id = i.usuario_id
       WHERE i.id = ?`,
      [result.insertId]
    );

    res.status(201).json(ingreso[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
