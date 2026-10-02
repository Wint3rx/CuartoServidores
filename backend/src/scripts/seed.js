import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

// Genera claves de API reales para los dispositivos, hashes de PIN
// para los usuarios de prueba y el administrador del panel.
// Las claves se muestran UNA sola vez: guardalas para el firmware.
// Si lo ejecutas de nuevo, se generan claves nuevas y las anteriores dejan de servir.

async function main() {
  console.log('\n=== Claves de API de dispositivos ===');
  const [dispositivos] = await pool.query('SELECT id, nombre FROM dispositivos');
  for (const d of dispositivos) {
    const key = crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(key, 10);
    await pool.query('UPDATE dispositivos SET api_key_hash = ? WHERE id = ?', [hash, d.id]);
    console.log(`${d.nombre}\n  x-device-id: ${d.nombre}\n  x-api-key:   ${key}\n`);
  }

  console.log('=== PIN de usuarios de prueba ===');
  const pins = { 'Usuario de prueba 1': '1234', 'Usuario de prueba 2': '5678' };
  for (const [nombre, pin] of Object.entries(pins)) {
    const hash = await bcrypt.hash(pin, 10);
    await pool.query('UPDATE usuarios SET pin_hash = ? WHERE nombre = ?', [hash, nombre]);
    console.log(`${nombre}: PIN ${pin}`);
  }

  console.log('\n=== Administrador del panel ===');
  const email = process.env.ADMIN_EMAIL || 'admin@cuarto.local';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('Define ADMIN_PASSWORD en el .env antes de ejecutar el seed.');
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO administradores (email, nombre, password_hash)
     VALUES (?, 'Administrador', ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [email, hash]
  );
  console.log(`Email: ${email}\n(la contrasena es la de ADMIN_PASSWORD en tu .env)\n`);

  await pool.end();
}

main().catch(async (err) => {
  console.error(err.message);
  await pool.end();
  process.exit(1);
});
