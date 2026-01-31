-- ============================================
-- ESQUEMA DE BASE DE DATOS SQLITE
-- Círculo Infantil - Sistema de Gestión
-- ============================================

-- Configuración de la base de datos
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================
-- TABLA: classrooms (Aulas)
-- Descripción: Almacena la información de las aulas del círculo infantil
-- ============================================

CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  max_capacity INTEGER NOT NULL CHECK(max_capacity >= 1 AND max_capacity <= 15),
  created_at TEXT NOT NULL
);

-- ============================================
-- TABLA: children (Niños)
-- Descripción: Almacena la información de los niños inscritos
-- Relaciones:
--   - classroom_id → classrooms.id (ON DELETE SET NULL)
-- ============================================

CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK(age >= 1 AND age <= 5),
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  has_paid INTEGER NOT NULL DEFAULT 0 CHECK(has_paid IN (0, 1)),
  has_aseo INTEGER NOT NULL DEFAULT 0 CHECK(has_aseo IN (0, 1)),
  classroom_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: workers (Trabajadores)
-- Descripción: Almacena la información del personal del círculo infantil
-- ============================================

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  salary REAL NOT NULL CHECK(salary > 0),
  hire_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================
-- TABLA: payments (Pagos)
-- Descripción: Registra todos los pagos realizados
-- Relaciones:
--   - child_id → children.id (ON DELETE CASCADE)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY NOT NULL,
  child_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  payment_date TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- ============================================
-- ÍNDICES
-- Descripción: Índices para optimizar consultas frecuentes
-- ============================================

-- Índice para buscar niños por aula
CREATE INDEX IF NOT EXISTS idx_children_classroom ON children(classroom_id);

-- Índice para buscar pagos por niño
CREATE INDEX IF NOT EXISTS idx_payments_child ON payments(child_id);

-- Índice para buscar pagos por fecha
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Índice para filtrar niños que pagaron
CREATE INDEX IF NOT EXISTS idx_children_paid ON children(has_paid);

-- Índice para filtrar niños con/sin aseo
CREATE INDEX IF NOT EXISTS idx_children_aseo ON children(has_aseo);

-- ============================================
-- CONSULTAS DE EJEMPLO
-- ============================================

-- Obtener todos los niños con su información de aula
-- SELECT c.*, cl.name as classroom_name
-- FROM children c
-- LEFT JOIN classrooms cl ON c.classroom_id = cl.id;

-- Obtener total recaudado por mes
-- SELECT strftime('%Y-%m', payment_date) as mes, SUM(amount) as total
-- FROM payments
-- GROUP BY mes;

-- Obtener niños sin aula asignada
-- SELECT * FROM children WHERE classroom_id IS NULL;

-- Obtener capacidad disponible por aula
-- SELECT cl.name, cl.max_capacity,
--        COUNT(c.id) as current_count,
--        (cl.max_capacity - COUNT(c.id)) as available
-- FROM classrooms cl
-- LEFT JOIN children c ON cl.id = c.classroom_id
-- GROUP BY cl.id;

-- Obtener historial de pagos de un niño
-- SELECT * FROM payments
-- WHERE child_id = 'ID_DEL_NIÑO'
-- ORDER BY payment_date DESC;
