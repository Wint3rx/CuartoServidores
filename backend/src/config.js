import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Un solo .env en la raiz del proyecto, sin importar desde donde se ejecute node.
// Si el archivo no existe (por ejemplo en un hosting), se usan las variables del sistema.
dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});

const requeridas = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const faltantes = requeridas.filter((k) => !process.env[k]);
if (faltantes.length > 0) {
  console.error(`Faltan variables en el .env: ${faltantes.join(', ')}`);
  console.error('Copia .env.example como .env y completa los valores.');
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
};
