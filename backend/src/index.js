import { config } from './config.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import lecturasRouter from './routes/lecturas.js';
import authRouter from './routes/auth.js';
import prediccionRouter from './routes/prediccion.js';
import dashboardRouter from './routes/dashboard.js';
import ingresosRouter from './routes/ingresos.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors()); // En desarrollo acepta cualquier origen; se restringe al desplegar.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS lecturas FROM lecturas');
    res.json({ ok: true, ...rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/lecturas', lecturasRouter);
app.use('/api/prediccion', prediccionRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ingresos', ingresosRouter);

// Rutas inexistentes
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Errores no controlados (Express 5 tambien captura los de funciones async)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

io.on('connection', (s) => console.log('Panel conectado:', s.id));

server.listen(config.port, () =>
  console.log(`API en http://localhost:${config.port}`)
);
