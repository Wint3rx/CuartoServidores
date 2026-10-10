# SysAdmin Pro - Server Room Monitoring System

Sistema integral de monitoreo en tiempo real diseñado para entornos de misión crítica (cuartos de servidores y data centers). Proporciona control de acceso biométrico, monitoreo térmico avanzado con análisis granular, predicción algorítmica de temperatura y gestión de alertas.

---

## 🚀 Características Principales

### 1. Dashboard Principal Interactivo
* **Métricas en Tiempo Real:** Visualización instantánea de temperatura actual, humedad, resumen de las últimas 24 horas y estadísticas de acceso.
* **Navegación Directa e Intuitiva:** Las tarjetas informativas del Dashboard son interactivas; al hacer clic sobre los módulos de Temperatura o Accesos, el sistema redirige automáticamente a la sección correspondiente.
* **Modelo Térmico Predictivo:** Algoritmo híbrido que combina la inercia térmica inmediata (últimas 50 lecturas) con el promedio histórico de 7 días para proyectar la temperatura de las próximas 24 horas, destacando alertas al superar el umbral crítico (>27.0°C).
* **Alertas Semánticas Visuales:** Código de color dinámico en tarjetas y gráficas (Azul = Frío, Verde/Teal = Normal, Ámbar = Caliente, Rojo parpadeante = Peligro).

### 2. Módulo Avanzado de Temperatura (`/temperature`)
* **Selector Histórico por Días:** Selector visual con tarjetas de los últimos días registrados, mostrando promedios y máximas para inspección individual.
* **Control Granular de Intervalos:**
  * **Cada 30 minutos:** Muestra cada lectura y punto individual registrado.
  * **Cada hora (1h), Cada 2 horas (2h) y Cada 4 horas (4h):** Agrupa automáticamente los cálculos de 30 minutos comprendidos en el bloque temporal y genera el promedio, valor mínimo y valor máximo consolidado.
* **Doble Modo de Visualización:**
  * **Gráfico Interactivo:** Curva suave con Recharts, tooltips informativos y escala automática.
  * **Tabla de Auditoría:** Lista detallada con rangos horarios, temperaturas, picos y etiquetas de estado (*Normal*, *Alto*, *Crítico*).
* **Exportación a CSV:** Botón para descargar el reporte consolidado del día seleccionado con la granularidad activa.
* **Auto-Refresco Dinámico:** Temporizador sincronizado con el intervalo seleccionado (30 min, 1h, 2h, 4h) y botón de refresco manual inmediato.
* **Control de Acceso por Roles:** Los administradores y analistas disponen de la vista granular completa conectada al backend.

### 3. Módulo de Seguridad y Registro de Accesos (`/access-logs`)
* **Doble Factor de Autenticación:** Soporte para validación biométrica facial (ESP32-CAM) respaldada por PIN de seguridad.
* **Trazabilidad Fotográfica:** Registro visual y temporal de cada intento de acceso (concedido o denegado).
* **Fichas Técnicas de Empleados:** Detalle del personal, nivel de autorización y departamento.

### 4. Seguridad y Autenticación
* **Sesiones Seguras vía JWT:** Tokens firmados criptográficamente para la protección de todas las rutas de la API.
* **Rutas Protegidas:** Control de acceso en frontend mediante `ProtectedRoute` y contexto global `AuthContext`.
* **Login Oficial:** Enlace directo con la base de datos y manejo de credenciales encriptadas con `bcryptjs`.

---

## 🛠️ Arquitectura y Tecnologías

```
CuartoServidores/
├── backend/            # API REST con Express y Node.js
├── frontend/           # SPA con React, TypeScript y Vite
├── database/           # Scripts SQL de esquema, actualizaciones y datos semilla
├── docker-compose.yml  # Configuración del contenedor de base de datos MySQL 8
├── iniciar_db.bat      # Script automático Windows (CMD) para arrancar DB y sembrar admin
├── iniciar_db.ps1      # Script automático Windows (PowerShell)
└── .env                # Variables de entorno globales del proyecto
```

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router DOM v6.
* **Backend:** Node.js (v18+), Express.js (v5), MySQL2 (Connection Pool), JWT, BcryptJS, Multer, Helmet, CORS.
* **Base de Datos:** MySQL 8.0 (vía Docker o instalación local).

---

## ⚙️ Requisitos Previos

* **[Node.js](https://nodejs.org/)** (v18 o superior).
* **Base de datos:**
  * **Opción Recomendada:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) en ejecución.
  * **Opción Alternativa:** [XAMPP](https://www.apachefriends.org/), Laragon o MySQL Server local.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el Repositorio y Configurar Variables

```bash
git clone <URL_DEL_REPOSITORIO>
cd CuartoServidores
```

Copia el archivo de variables de entorno de ejemplo en la raíz del proyecto (si no existe ya):
```bash
cp .env.example .env
```

Contenido base del `.env`:
```env
PORT=3000

# Base de datos (puerto 3307 para Docker, 3306 para XAMPP/MySQL local)
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=cuarto_servidores
DB_USER=cuarto_user
DB_PASSWORD=Cuarto_Pass_2026
DB_ROOT_PASSWORD=Root_Pass_2026

# Seguridad JWT
JWT_SECRET=tu_clave_secreta_jwt_aqui

# Credenciales iniciales del Administrador (usadas en seed)
ADMIN_EMAIL=admin@cuarto.local
ADMIN_PASSWORD=Admin_Pass_2026
```

---

### 2. Inicializar la Base de Datos

#### 👉 Opción A: Con Docker (Recomendado y Automático)
Con Docker Desktop abierto, ejecuta el script de inicialización desde la raíz del proyecto:

* **En Windows (doble clic o terminal CMD):**
  ```cmd
  iniciar_db.bat
  ```
* **En Windows (PowerShell):**
  ```powershell
  .\iniciar_db.ps1
  ```
* **O manualmente con comandos de Docker:**
  ```bash
  docker compose up -d
  npm --prefix backend run seed
  ```

*Este script levanta el contenedor de MySQL en el puerto `3307`, aplica los esquemas SQL de `database/` y ejecuta el semillero generando el usuario administrador.*

#### 👉 Opción B: Con XAMPP o MySQL Local (Sin Docker)
1. Abre **XAMPP** y dale a **Start** en MySQL.
2. Abre [phpMyAdmin](http://localhost/phpmyadmin) y crea la base de datos `cuarto_servidores`.
3. En la pestaña **Importar**, carga los scripts de la carpeta `database/` en orden:
   1. `schema.sql`
   2. `schema_updates.sql`
   3. `seed_historico.sql` *(opcional, datos de prueba)*
4. Modifica tu archivo `.env`:
   ```env
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   ```
5. En la carpeta `backend`, corre el semillero:
   ```bash
   npm --prefix backend run seed
   ```

---

### 3. Iniciar el Backend

Abre una terminal en la carpeta `backend`:
```bash
cd backend
npm install
npm run dev
```
El servidor backend se iniciará en **`http://localhost:3000`**.

---

### 4. Iniciar el Frontend

Abre otra terminal en la carpeta `frontend`:
```bash
cd frontend
npm install
npm run dev
```
El frontend estará disponible en **`http://localhost:5173`** (o el puerto indicado por Vite).

---

## 🔑 Credenciales de Acceso por Defecto

Al abrir la aplicación en el navegador (`http://localhost:5173`), inicia sesión con:

* **Usuario / Correo:** `admin@cuarto.local` *(o simplemente `admin`)*
* **Contraseña:** `Admin_Pass_2026`

---

## 📡 Integración de Hardware IoT

El backend cuenta con endpoints preparados para interactuar con microcontroladores:

1. **Lectura de Temperatura:** El microcontrolador (ESP32) envía lecturas vía `POST /api/lecturas` con `x-device-id` y `x-api-key` generados durante el `npm run seed`.
2. **Acceso y Cámara:** El ESP32-CAM envía imágenes en formato `multipart/form-data` a `/api/ingresos` para validación facial y registro fotográfico en disco.

---

## 📄 Licencia

Este proyecto está distribuido bajo la Licencia MIT.
