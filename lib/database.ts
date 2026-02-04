import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// Inicializar la base de datos
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync('circulo_infantil.db');

    // Habilitamos Foreign Keys (Indispensable para CASCADE)
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      -- TRABAJADORES
      -- No tiene dependencias padre.
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        salary REAL NOT NULL,
        hire_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- AULAS
      -- Si se borra el Profesor (worker), teacher_id se vuelve NULL, pero el aula NO se borra.
      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE, 
        teacher_id TEXT, 
        teacher_name TEXT,
        max_capacity INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES workers(id) ON DELETE SET NULL
      );

      -- NIÑOS
      -- Si se borra el Aula, classroom_id se vuelve NULL, pero el niño NO se borra.
      CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        parent_name TEXT NOT NULL,
        parent_phone TEXT NOT NULL,
        address TEXT NOT NULL,
        has_paid INTEGER NOT NULL DEFAULT 0,
        has_aseo INTEGER NOT NULL DEFAULT 0,
        last_aseo_date TEXT, 
        classroom_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
      );

      -- PAGOS
      -- Si se borra el Niño, se borran TODOS sus pagos automáticamente (CASCADE).
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        child_id TEXT NOT NULL,
        child_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      );

      -- Índices
      CREATE INDEX IF NOT EXISTS idx_children_classroom ON children(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_payments_child ON payments(child_id);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
      CREATE INDEX IF NOT EXISTS idx_children_paid ON children(has_paid);
      CREATE INDEX IF NOT EXISTS idx_children_aseo ON children(has_aseo);
    `);
    
    // Mantenimiento legacy (por si acaso, aunque recomiendo reinstalar app)
    try {
        await db.execAsync("ALTER TABLE children ADD COLUMN last_aseo_date TEXT;");
    } catch (e) {
        // Ignoramos si ya existe
    }

    console.log('Base de datos SQLite inicializada correctamente con reglas CASCADE/SET NULL');
    return db;
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
};

// Obtener instancia de la base de datos
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initDatabase();
  }
  return db;
};

// Cerrar la base de datos
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};