# SysAdmin Pro - Server Room Monitoring System

Un sistema de monitoreo en tiempo real diseñado para entornos de misión crítica (cuartos de servidores y data centers). Proporciona control de acceso biométrico estricto, monitoreo de temperatura en tiempo real y análisis predictivo para la prevención de riesgos térmicos.

![SysAdmin Pro Mockup](https://raw.githubusercontent.com/TuUsuario/TuRepositorio/main/docs/preview.png) *(Puedes agregar una captura de pantalla aquí posteriormente)*

## Características Principales

### Módulo de Seguridad y Accesos
* **Doble Factor Biométrico:** Integración preparada para validación facial usando ESP32-CAM y ESP-WHO, con respaldo de código PIN.
* **Trazabilidad Completa:** Historial fotográfico y temporal de cada intento de acceso (concedido o denegado).
* **Fichas Técnicas Dinámicas:** Visualización detallada de los datos del empleado, niveles de autorización, departamento corporativo y trazabilidad biométrica de la base de datos (Face ID).

### Módulo Térmico y Predictivo
* **Monitoreo en Tiempo Real:** Gráficas interactivas detalladas por hora y día.
* **Modelo de Predicción Híbrido:** Algoritmo de tendencia lineal que calcula:
  1. La media histórica (últimos 7 días).
  2. La inercia térmica inmediata (últimas 50 lecturas).
  3. Alertas automáticas para superar el umbral crítico (>27.0°C).
* **Indicadores Visuales Semánticos:** Tarjetas de datos con colores que reflejan el estado del servidor (azul = frío, amarillo = advertencia, rojo parpadeante = crítico).

### Diseño Mobile-First UI/UX
* Dashboard 100% responsivo adaptado para pantallas de todos los tamaños.
* Interfaz moderna usando **Tailwind CSS v4** y componentes de vidrio (glassmorphism).

---

## Arquitectura y Tecnologías

El sistema está dividido en tres capas principales:

### Frontend (Cliente Administrativo)
* **Framework:** React 18 con TypeScript y Vite.
* **Estilos:** Tailwind CSS (Diseño Mobile First, Flexbox, Grids, micro-animaciones).
* **Iconografía:** Lucide React.
* **Gráficas:** Recharts.
* **Enrutamiento:** React Router DOM (Rutas Privadas).
* **Seguridad:** AuthContext con autenticación vía JSON Web Tokens (JWT).

### Backend (API REST & WebSockets)
* **Entorno:** Node.js + Express.js.
* **Base de Datos:** MySQL.
* **Almacenamiento de Archivos:** Multer (Para recibir y servir capturas biométricas del ESP32).
* **Tiempo Real:** Socket.io.
* **Seguridad:** JWT (JsonWebToken) para protección de rutas y CORS.

### Base de Datos
* **Motor:** MySQL
* **Esquema Principal:** Tablas relacionales para control de `usuarios` (roles, face_id, niveles de acceso), `ingresos` (log de entradas con rutas a imágenes), y `temperatura` (registros horarios continuos).

---

## Instalación y Despliegue Local

### Requisitos Previos
* [Node.js](https://nodejs.org/es/) (v16 o superior)
* [MySQL Server](https://dev.mysql.com/downloads/mysql/)
* Git

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TuUsuario/SysAdmin-Pro.git
cd SysAdmin-Pro
```

### 2. Configurar la Base de Datos
1. Inicia tu servidor MySQL.
2. Ejecuta el script de la base de datos ubicado en `database/schema.sql` (o el archivo que contenga tus tablas) para crear la base de datos y las tablas base.
3. Configura tus credenciales.

### 3. Configurar y Levantar el Backend
```bash
cd backend
npm install
```
Crea un archivo `.env` en la raíz de `backend` con las variables de entorno necesarias (Ajusta los valores según tu máquina):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cuarto_servidores
JWT_SECRET=tu_secreto_super_seguro
PORT=5000
```
Inicia el servidor backend:
```bash
# Modo desarrollo
npm run dev
```

### 4. Configurar y Levantar el Frontend
Abre una nueva terminal en la raíz del proyecto.
```bash
cd frontend
npm install
```
Crea un archivo `.env` en la raíz de `frontend` (opcional si usas las URLs quemadas en código, recomendado usar variables):
```env
VITE_API_URL=http://localhost:5000
```
Inicia el servidor frontend de Vite:
```bash
npm run dev
```

El panel estará disponible en `http://localhost:5173`. Las credenciales por defecto para desarrollo suelen ser `admin` (revisa tu lógica de Login/Auth).

---

## Integración de Hardware (IoT)
El backend está preparado para recibir peticiones POST directamente desde un **ESP32** o **ESP32-CAM**:
1. **Temperatura:** El microcontrolador hace POST a `/api/temperatura` con el valor actual en grados Celsius.
2. **Accesos Biométicos:** La ESP32-CAM captura la fotografía al detectar un rostro. Valida internamente o envía mediante un formulario `multipart/form-data` usando Multer al endpoint de `/api/ingresos`.

---

## Contribuciones
¡Las contribuciones son bienvenidas! Si deseas mejorar el modelo predictivo, añadir soporte para más tipos de sensores (humedad, humo) o mejorar la interfaz:
1. Haz un Fork del proyecto.
2. Crea tu rama de características (`git checkout -b feature/NuevaCaracteristica`).
3. Haz commit de tus cambios (`git commit -m 'Añade nueva característica'`).
4. Haz Push a la rama (`git push origin feature/NuevaCaracteristica`).
5. Abre un Pull Request.

---

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
