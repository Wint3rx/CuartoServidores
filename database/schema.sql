-- =====================================================
-- Sistema IoT de Control de Acceso y Temperatura
-- Cuarto de Servidores - UMG Campus Jutiapa
-- Motor: MySQL 8.0 / InnoDB
-- =====================================================

CREATE DATABASE IF NOT EXISTS cuarto_servidores
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cuarto_servidores;

-- -----------------------------------------------------
-- Dispositivos (ESP32 y ESP32-CAM)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(60)  NOT NULL UNIQUE,
  tipo          ENUM('esp32','esp32cam') NOT NULL,
  api_key_hash  VARCHAR(255) NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Usuarios autorizados para entrar al cuarto
-- (el PIN se guarda hasheado; face_id es el ID en ESP-WHO)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  pin_hash  VARCHAR(255) NOT NULL,
  face_id   INT UNSIGNED NULL UNIQUE,
  rol       VARCHAR(30)  NOT NULL DEFAULT 'usuario',
  activo    BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Administradores del panel web (login con JWT)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS administradores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(120) NOT NULL UNIQUE,
  nombre        VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Ventiladores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ventiladores (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  tipo   ENUM('principal','respaldo') NOT NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Configuración (umbrales e intervalos), clave-valor
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  clave       VARCHAR(60) PRIMARY KEY,
  valor       VARCHAR(60) NOT NULL,
  descripcion VARCHAR(200) NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Accesos (usuario_id NULL = rostro/PIN desconocido)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS accesos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT UNSIGNED NULL,
  dispositivo_id INT UNSIGNED NOT NULL,
  metodo         ENUM('rostro','codigo') NOT NULL,
  resultado      ENUM('autorizado','denegado') NOT NULL,
  fecha_hora     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_accesos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_accesos_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
  INDEX idx_accesos_fecha (fecha_hora),
  INDEX idx_accesos_usuario (usuario_id, fecha_hora)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Lecturas del DHT22 (una por minuto)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lecturas (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id INT UNSIGNED NOT NULL,
  temperatura    DECIMAL(4,1) NOT NULL,
  humedad        DECIMAL(4,1) NOT NULL,
  fecha_hora     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lecturas_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
  INDEX idx_lecturas_fecha (fecha_hora),
  INDEX idx_lecturas_disp_fecha (dispositivo_id, fecha_hora)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Activaciones de ventiladores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS activaciones (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ventilador_id INT UNSIGNED NOT NULL,
  lectura_id    INT UNSIGNED NULL,
  causa         ENUM('temperatura_alta','falla_principal','manual') NOT NULL,
  inicio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fin           DATETIME NULL,
  CONSTRAINT fk_activ_ventilador
    FOREIGN KEY (ventilador_id) REFERENCES ventiladores(id),
  CONSTRAINT fk_activ_lectura
    FOREIGN KEY (lectura_id) REFERENCES lecturas(id) ON DELETE SET NULL,
  INDEX idx_activ_inicio (inicio)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Notificaciones enviadas (Telegram / correo)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  acceso_id      INT UNSIGNED NULL,
  lectura_id     INT UNSIGNED NULL,
  tipo_evento    VARCHAR(40)  NOT NULL,
  canal          ENUM('telegram','email') NOT NULL,
  destinatario   VARCHAR(120) NOT NULL,
  estado_entrega ENUM('pendiente','enviado','fallido') NOT NULL DEFAULT 'pendiente',
  fecha_hora     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_acceso
    FOREIGN KEY (acceso_id) REFERENCES accesos(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_lectura
    FOREIGN KEY (lectura_id) REFERENCES lecturas(id) ON DELETE SET NULL,
  INDEX idx_notif_fecha (fecha_hora)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Heartbeats (para calcular disponibilidad / uptime)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS heartbeats (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id INT UNSIGNED NOT NULL,
  fecha_hora     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hb_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
  INDEX idx_hb_disp_fecha (dispositivo_id, fecha_hora)
) ENGINE=InnoDB;

-- =====================================================
-- DATOS INICIALES
-- Los hashes son marcadores: el backend los reemplazará
-- con bcrypt reales (seed del admin y claves de API).
-- =====================================================

INSERT IGNORE INTO dispositivos (nombre, tipo, api_key_hash) VALUES
  ('esp32-principal',   'esp32',    'PENDIENTE_HASH'),
  ('esp32-cam-entrada', 'esp32cam', 'PENDIENTE_HASH');

INSERT IGNORE INTO ventiladores (nombre, tipo) VALUES
  ('Ventilador 1', 'principal'),
  ('Ventilador 2', 'respaldo'),
  ('Ventilador 3', 'respaldo');

INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES
  ('temp_alerta',          '27.0', 'Grados C: activa ventiladores de respaldo'),
  ('temp_critica',         '32.0', 'Grados C: envia alerta critica por correo'),
  ('intervalo_lectura_seg','60',   'Segundos entre lecturas del DHT22'),
  ('heartbeat_seg',        '60',   'Segundos entre heartbeats'),
  ('heartbeat_timeout_seg','180',  'Segundos sin heartbeat para marcar sin senal');

INSERT IGNORE INTO usuarios (nombre, pin_hash, face_id, rol) VALUES
  ('Usuario de prueba 1', 'PENDIENTE_HASH', 1, 'usuario'),
  ('Usuario de prueba 2', 'PENDIENTE_HASH', 2, 'usuario');

INSERT INTO lecturas (dispositivo_id, temperatura, humedad, fecha_hora) VALUES
  (1, 23.4, 45.2, NOW() - INTERVAL 3 MINUTE),
  (1, 23.6, 45.0, NOW() - INTERVAL 2 MINUTE),
  (1, 23.9, 44.8, NOW() - INTERVAL 1 MINUTE);

INSERT INTO accesos (usuario_id, dispositivo_id, metodo, resultado, fecha_hora) VALUES
  (1,    2, 'rostro', 'autorizado', NOW() - INTERVAL 10 MINUTE),
  (2,    1, 'codigo', 'autorizado', NOW() - INTERVAL 5 MINUTE),
  (NULL, 2, 'rostro', 'denegado',   NOW() - INTERVAL 2 MINUTE);
-- Tabla de ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT UNSIGNED NULL,
  imagen_path    VARCHAR(500) NULL,
  imagen_url     VARCHAR(500) NULL,
  hora_exacta    DATETIME NOT NULL,
  fecha_hora     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones  TEXT NULL,
  CONSTRAINT fk_ingresos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ingresos_fecha (fecha_hora),
  INDEX idx_ingresos_usuario (usuario_id, fecha_hora)
) ENGINE=InnoDB;

