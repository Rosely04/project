# Base de Datos SQLite - Círculo Infantil

## Descripción General

Esta aplicación utiliza **SQLite** como sistema de gestión de base de datos local para almacenar todos los datos de manera persistente en el dispositivo móvil.

## Archivo de Base de Datos

- **Nombre**: `circulo_infantil.db`
- **Ubicación**: Almacenamiento local del dispositivo
- **Motor**: SQLite con Expo SQLite
- **Características**:
  - WAL Mode (Write-Ahead Logging) para mejor rendimiento
  - Integridad referencial habilitada (FOREIGN KEYS = ON)

## Estructura de Tablas

### 1. Tabla `classrooms` (Aulas)

Almacena información sobre las aulas del círculo infantil.

```sql
CREATE TABLE classrooms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
```

**Campos:**
- `id`: Identificador único del aula
- `name`: Nombre del aula (ej: "Aula 1", "Preescolar A")
- `teacher_id`: ID del trabajador asignado como maestra
- `teacher_name`: Nombre de la maestra (desnormalizado para consultas rápidas)
- `max_capacity`: Capacidad máxima de niños (1-15)
- `created_at`: Fecha de creación del registro

---

### 2. Tabla `children` (Niños)

Almacena información de los niños inscritos en el círculo infantil.

```sql
CREATE TABLE children (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  has_paid INTEGER NOT NULL DEFAULT 0,
  has_aseo INTEGER NOT NULL DEFAULT 0,
  classroom_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
);
```

**Campos:**
- `id`: Identificador único del niño
- `name`: Nombre completo del niño
- `age`: Edad del niño (1-5 años)
- `parent_name`: Nombre del padre/madre o tutor
- `parent_phone`: Teléfono de contacto (formato: +53xxxxxxxx)
- `address`: Dirección de residencia
- `has_paid`: Estado de pago (0 = No pagado, 1 = Pagado)
- `has_aseo`: Estado de aseo (0 = Sin aseo, 1 = Con aseo)
- `classroom_id`: Referencia al aula asignada (puede ser NULL)
- `created_at`: Fecha de registro

**Relaciones:**
- `classroom_id` → `classrooms.id` (ON DELETE SET NULL)
  - Si se elimina un aula, los niños quedan sin aula asignada

**Índices:**
```sql
CREATE INDEX idx_children_classroom ON children(classroom_id);
CREATE INDEX idx_children_paid ON children(has_paid);
CREATE INDEX idx_children_aseo ON children(has_aseo);
```

---

### 3. Tabla `workers` (Trabajadores)

Almacena información del personal del círculo infantil.

```sql
CREATE TABLE workers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  salary REAL NOT NULL,
  hire_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

**Campos:**
- `id`: Identificador único del trabajador
- `name`: Nombre completo del trabajador
- `position`: Cargo (ej: "Maestra", "Directora", "Auxiliar")
- `phone`: Teléfono de contacto (formato: +53xxxxxxxx)
- `email`: Correo electrónico (opcional)
- `salary`: Salario mensual
- `hire_date`: Fecha de contratación
- `created_at`: Fecha de registro

---

### 4. Tabla `payments` (Pagos)

Registra todos los pagos realizados por los padres.

```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY NOT NULL,
  child_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);
```

**Campos:**
- `id`: Identificador único del pago
- `child_id`: Referencia al niño que realizó el pago
- `child_name`: Nombre del niño (desnormalizado)
- `amount`: Monto del pago
- `payment_date`: Fecha del pago (formato: YYYY-MM-DD)
- `description`: Descripción del pago
- `created_at`: Fecha de registro

**Relaciones:**
- `child_id` → `children.id` (ON DELETE CASCADE)
  - Si se elimina un niño, se eliminan todos sus pagos

**Índices:**
```sql
CREATE INDEX idx_payments_child ON payments(child_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

## Diagrama de Relaciones

```
┌─────────────┐
│  workers    │
│             │
│  - id (PK)  │
│  - name     │
│  - position │
│  - phone    │
│  - email    │
│  - salary   │
└──────┬──────┘
       │
       │ teacher_id
       │
       ↓
┌─────────────────┐         ┌──────────────┐
│  classrooms     │         │   children   │
│                 │←────────│              │
│  - id (PK)      │         │  - id (PK)   │
│  - name         │         │  - name      │
│  - teacher_id   │         │  - age       │
│  - teacher_name │         │  - has_paid  │
│  - max_capacity │         │  - has_aseo  │
└─────────────────┘         │  - classroom_id (FK) │
                            └──────┬───────┘
                                   │
                                   │ child_id
                                   │
                                   ↓
                            ┌─────────────┐
                            │  payments   │
                            │             │
                            │  - id (PK)  │
                            │  - child_id (FK) │
                            │  - amount   │
                            │  - payment_date │
                            └─────────────┘
```

## Características de Integridad

### Foreign Keys (Claves Foráneas)

1. **children.classroom_id → classrooms.id**
   - Tipo: SET NULL
   - Al eliminar un aula, los niños quedan sin aula asignada

2. **payments.child_id → children.id**
   - Tipo: CASCADE
   - Al eliminar un niño, se eliminan todos sus pagos automáticamente

### Validaciones a Nivel de Aplicación

- **Edad de niños**: 1-5 años
- **Capacidad de aulas**: 1-15 niños
- **Formato de teléfono**: +53 seguido de 8 dígitos
- **Email**: Formato válido (opcional en workers)
- **Nombres**: Solo letras y espacios

## Funciones de la Base de Datos

### Inicialización

```typescript
import { initDatabase } from '@/lib/database';

// Inicializar la base de datos al arrancar la app
await initDatabase();
```

### Operaciones CRUD

Todas las operaciones están disponibles en `/lib/storage.ts`:

#### Niños (Children)
- `getChildren()`: Obtener todos los niños
- `saveChild(child)`: Crear o actualizar un niño
- `deleteChild(childId)`: Eliminar un niño
- `updateChildPaymentStatus(childId, hasPaid)`: Actualizar estado de pago
- `updateChildAseoStatus(childId, hasAseo)`: Actualizar estado de aseo
- `updateChildClassroom(childId, classroomId)`: Asignar/quitar aula

#### Trabajadores (Workers)
- `getWorkers()`: Obtener todos los trabajadores
- `saveWorker(worker)`: Crear o actualizar un trabajador
- `deleteWorker(workerId)`: Eliminar un trabajador

#### Pagos (Payments)
- `getPayments()`: Obtener todos los pagos
- `savePayment(payment)`: Registrar un pago

#### Aulas (Classrooms)
- `getClassrooms()`: Obtener todas las aulas
- `saveClassroom(classroom)`: Crear o actualizar un aula
- `deleteClassroom(classroomId)`: Eliminar un aula

## Migración desde AsyncStorage

Si ya tenías datos en AsyncStorage, necesitarás migrarlos manualmente. La aplicación ahora usa exclusivamente SQLite para almacenamiento persistente.

## Respaldo y Restauración

El archivo de base de datos (`circulo_infantil.db`) se almacena localmente en el dispositivo. Para hacer respaldos:

1. Exportar la base de datos desde el dispositivo
2. Copiar el archivo `.db` a un lugar seguro
3. Para restaurar, reemplazar el archivo en el dispositivo

## Ventajas de SQLite

- **Persistencia**: Los datos se mantienen entre reinicios de la app
- **Relaciones**: Integridad referencial entre tablas
- **Consultas complejas**: Posibilidad de hacer JOINs y queries avanzadas
- **Rendimiento**: Índices optimizan las consultas frecuentes
- **Transacciones**: Soporte completo para transacciones ACID
- **Sin servidor**: No requiere conexión a internet ni servidor externo

## Notas Técnicas

- **Tipo de datos TEXT para IDs**: Se usan IDs generados con `Date.now().toString()`
- **Booleanos**: SQLite no tiene tipo boolean nativo, se usa INTEGER (0/1)
- **Fechas**: Se almacenan como TEXT en formato ISO 8601
- **WAL Mode**: Mejora el rendimiento permitiendo lecturas concurrentes
