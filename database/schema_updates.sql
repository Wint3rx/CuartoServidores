-- Tabla para módulo de ingresos con imagen, ID de usuario y hora exacta
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
