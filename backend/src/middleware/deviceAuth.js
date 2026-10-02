import bcrypt from 'bcryptjs';
import pool from '../db.js';

// El ESP32 envia dos encabezados:
//   x-device-id: nombre del dispositivo (ej. "esp32-principal")
//   x-api-key:   su clave secreta
export async function deviceAuth(req, res, next) {
  const nombre = req.header('x-device-id');
  const key = req.header('x-api-key');

  if (!nombre || !key) {
    return res.status(401).json({ error: 'Faltan x-device-id o x-api-key' });
  }

  const [rows] = await pool.query(
    'SELECT id, nombre, api_key_hash, activo FROM dispositivos WHERE nombre = ?',
    [nombre]
  );
  const device = rows[0];

  // Mismo mensaje en todos los casos para no revelar si el dispositivo existe
  if (!device || !device.activo || !(await bcrypt.compare(key, device.api_key_hash))) {
    return res.status(401).json({ error: 'Dispositivo no autorizado' });
  }

  req.device = { id: device.id, nombre: device.nombre };
  next();
}
