import { getDatabase } from './database';
import { Child, Worker, Payment, Classroom } from '../types';

// ==========================================
// HELPERS (Validaciones de fechas y reglas)
// ==========================================

const DAYS_30_IN_MS = 30 * 24 * 60 * 60 * 1000;

// Verifica si han pasado 30 días desde la fecha dada (Para habilitar botón de pago/aseo)
const hasPassed30Days = (dateString: string | null | undefined): boolean => {
  if (!dateString) return true; // Si no hay fecha previa, se considera vencido (disponible)
  const date = new Date(dateString);
  const now = new Date();
  
  // Validamos si la fecha es válida
  if (isNaN(date.getTime())) return true;
  
  return (now.getTime() - date.getTime()) >= DAYS_30_IN_MS;
};

// Calcula los ciclos de 30 días trabajados (Para salarios justos)
// Ejemplo: 2 días trabajados = 1 mes pago. 35 días trabajados = 2 meses pago.
const getMonthsWorked = (hireDateStr: string): number => {
  const hireDate = new Date(hireDateStr);
  const now = new Date();
  
  if (isNaN(hireDate.getTime()) || hireDate > now) return 0;

  // Calculamos la diferencia total en días exactos
  const diffTime = Math.abs(now.getTime() - hireDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Fórmula: Cada bloque de 30 días iniciado cuenta como 1 salario.
  // Math.floor(dias / 30) nos da los periodos completos, +1 incluye el periodo actual en curso.
  return Math.floor(diffDays / 30) + 1; 
};

// ==========================================
// CHILDREN FUNCTIONS (CON AUTO-RESETEO DE 30 DÍAS)
// ==========================================

export const getChildren = async (): Promise<Child[]> => {
  try {
    const db = await getDatabase();
    // Traemos children ordenados por fecha de creación
    const children = await db.getAllAsync<any>(
      'SELECT * FROM children ORDER BY created_at DESC'
    );

    // Iteramos uno por uno para comprobar si se les venció el pago o el aseo (30 días)
    // Esto es el "Lazy Check": el estado se actualiza solo cuando miras la lista
    const updatedChildren = await Promise.all(children.map(async (row) => {
      let updates: string[] = [];
      let updateValues: any[] = [];
      let finalHasPaid = Boolean(row.has_paid);
      let finalHasAseo = Boolean(row.has_aseo);

      // 1. Verificar vencimiento de PAGO (Lazy Reset)
      if (row.has_paid === 1) {
        // Consultar el último pago real en el historial
        const lastPayment = await db.getFirstAsync<{ payment_date: string }>(
          'SELECT payment_date FROM payments WHERE child_id = ? ORDER BY payment_date DESC LIMIT 1',
          [row.id]
        );
        // Si no hay pago registrado o la fecha tiene +30 días, reseteamos a false (debe pagar de nuevo)
        if (!lastPayment || hasPassed30Days(lastPayment.payment_date)) {
          finalHasPaid = false;
          updates.push('has_paid = 0');
        }
      }

      // 2. Verificar vencimiento de ASEO (Lazy Reset)
      if (row.has_aseo === 1) {
        // Usamos la columna last_aseo_date de la misma tabla
        if (!row.last_aseo_date || hasPassed30Days(row.last_aseo_date)) {
          finalHasAseo = false;
          updates.push('has_aseo = 0');
        }
      }

      // Si detectamos cambios (pasó el mes), actualizamos silenciosamente la DB
      if (updates.length > 0) {
        updateValues.push(row.id);
        await db.runAsync(
          `UPDATE children SET ${updates.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Devolvemos el objeto con el estado actualizado (ya sea pagado o pendiente)
      return {
        ...row,
        has_paid: finalHasPaid,
        has_aseo: finalHasAseo,
        last_aseo_date: row.last_aseo_date
      };
    }));

    return updatedChildren;

  } catch (error) {
    console.error('Error getting children:', error);
    return [];
  }
};

export const saveChild = async (child: Child): Promise<void> => {
  try {
    const db = await getDatabase();

    // REGLA: No puede haber un niño con el mismo nombre y el mismo padre.
    const duplicateCheck = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM children WHERE name = ? AND parent_name = ? AND id != ?`,
      [child.name.trim(), child.parent_name.trim(), child.id]
    );

    if (duplicateCheck) {
      throw new Error(`El padre "${child.parent_name}" ya tiene un hijo registrado como "${child.name}".`);
    }

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM children WHERE id = ?', [child.id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE children SET name=?, age=?, parent_name=?, parent_phone=?, address=?, classroom_id=? WHERE id=?`,
        [child.name, child.age, child.parent_name, child.parent_phone, child.address, child.classroom_id || null, child.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO children (id, name, age, parent_name, parent_phone, address, has_paid, has_aseo, classroom_id, created_at, last_aseo_date) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NULL)`,
        [child.id, child.name, child.age, child.parent_name, child.parent_phone, child.address, child.classroom_id || null, child.created_at]
      );
    }
  } catch (error) {
    console.error('Error saving child:', error);
    throw error;
  }
};

export const deleteChild = async (childId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM children WHERE id = ?', [childId]);
  } catch (error) {
    console.error('Error deleting child:', error);
    throw error;
  }
};

// ==========================================
// FINANCIAL & WORKERS
// ==========================================

// Función financiera para el Dashboard (Cálculos Estrictos)
export const getFinancialSummary = async () => {
  try {
    const db = await getDatabase();

    // 1. Ingresos (Histórico acumulado de tabla payments - El dinero NUNCA se borra)
    const incomeResult = await db.getFirstAsync<{ total: number }>('SELECT SUM(amount) as total FROM payments');
    const totalRevenue = incomeResult?.total || 0;

    // 2. Gastos Salarios (Histórico acumulado por días trabajados)
    const workers = await db.getAllAsync<Worker>('SELECT salary, hire_date FROM workers');
    let totalSalariesExpenses = 0;
    
    workers.forEach(worker => {
      // Calculamos periodos de 30 días exactos desde contratación
      const months = getMonthsWorked(worker.hire_date);
      // Gasto = Salario mensual * Periodos activos
      totalSalariesExpenses += (worker.salary * months);
    });

    return { totalRevenue, totalSalariesExpenses };
  } catch (error) {
    console.error("Error finance summary", error);
    return { totalRevenue: 0, totalSalariesExpenses: 0 };
  }
};

export const getWorkers = async (): Promise<Worker[]> => {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Worker>('SELECT * FROM workers ORDER BY created_at DESC');
  } catch (error) {
    console.error('Error getting workers:', error);
    return [];
  }
};

export const saveWorker = async (worker: Worker): Promise<void> => {
  try {
    const db = await getDatabase();
    
    // Validar teléfono duplicado
    const phoneCheck = await db.getFirstAsync('SELECT id FROM workers WHERE phone = ? AND id != ?', [worker.phone, worker.id]);
    if (phoneCheck) throw new Error('Teléfono ya registrado.');

    // Validar email duplicado
    if (worker.email) {
      const emailCheck = await db.getFirstAsync('SELECT id FROM workers WHERE email = ? AND id != ?', [worker.email, worker.id]);
      if (emailCheck) throw new Error('Email ya registrado.');
    }

    const existing = await db.getFirstAsync('SELECT id FROM workers WHERE id = ?', [worker.id]);
    if (existing) {
      await db.runAsync(
        'UPDATE workers SET name=?, position=?, phone=?, email=?, salary=?, hire_date=? WHERE id=?',
        [worker.name, worker.position, worker.phone, worker.email||null, worker.salary, worker.hire_date, worker.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO workers (id, name, position, phone, email, salary, hire_date, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [worker.id, worker.name, worker.position, worker.phone, worker.email||null, worker.salary, worker.hire_date, worker.created_at]
      );
    }
  } catch (error) {
    console.error('Error saving worker:', error);
    throw error;
  }
};

export const deleteWorker = async (workerId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workers WHERE id = ?', [workerId]);
  } catch (error) { throw error; }
};

// ==========================================
// PAYMENTS
// ==========================================

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Payment>('SELECT * FROM payments ORDER BY payment_date DESC, created_at DESC');
  } catch (error) { return []; }
};

export const savePayment = async (payment: Payment): Promise<void> => {
  try {
    const db = await getDatabase();
    // Validar que no haya pagado ya en los últimos 30 días
    const lastPayment = await db.getFirstAsync<{ payment_date: string }>(
      'SELECT payment_date FROM payments WHERE child_id = ? ORDER BY payment_date DESC LIMIT 1',
      [payment.child_id]
    );

    if (lastPayment && !hasPassed30Days(lastPayment.payment_date)) {
      throw new Error('Este niño ya tiene un pago registrado en los últimos 30 días.');
    }

    // Insertamos pago y acumulamos en el historial
    await db.runAsync(
      'INSERT INTO payments (id, child_id, child_name, amount, payment_date, description, created_at) VALUES (?,?,?,?,?,?,?)',
      [payment.id, payment.child_id, payment.child_name, payment.amount, payment.payment_date, payment.description, payment.created_at]
    );
    // Activamos el check en el niño
    await db.runAsync('UPDATE children SET has_paid = 1 WHERE id = ?', [payment.child_id]);
  } catch (error) {
    console.error('Error saving payment:', error);
    throw error;
  }
};

export const updateChildPaymentStatus = async (childId: string, hasPaid: boolean): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('UPDATE children SET has_paid = ? WHERE id = ?', [hasPaid ? 1 : 0, childId]);
  } catch (error) { throw error; }
};

// ==========================================
// ASEO
// ==========================================

export const updateChildAseoStatus = async (childId: string, hasAseo: boolean): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (hasAseo) {
      // Verificamos si ya tenía aseo en los últimos 30 días
      const child = await db.getFirstAsync<{ last_aseo_date: string }>('SELECT last_aseo_date FROM children WHERE id = ?', [childId]);
      if (child && child.last_aseo_date && !hasPassed30Days(child.last_aseo_date)) {
        throw new Error('Ya se registró aseo en los últimos 30 días.');
      }
      await db.runAsync('UPDATE children SET has_aseo = 1, last_aseo_date = ? WHERE id = ?', [now, childId]);
    } else {
      // Opción de desmarcar manual
      await db.runAsync('UPDATE children SET has_aseo = 0 WHERE id = ?', [childId]);
    }
  } catch (error) {
    console.error('Error aseo:', error);
    throw error;
  }
};

// ==========================================
// CLASSROOMS
// ==========================================

export const getClassrooms = async (): Promise<Classroom[]> => {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Classroom>('SELECT * FROM classrooms ORDER BY created_at DESC');
  } catch (error) { return []; }
};

export const saveClassroom = async (classroom: Classroom): Promise<void> => {
  try {
    const db = await getDatabase();
    // Validar nombre de aula único
    const nameCheck = await db.getFirstAsync('SELECT id FROM classrooms WHERE name = ? AND id != ?', [classroom.name, classroom.id]);
    if (nameCheck) throw new Error('Ya existe un aula con ese nombre.');

    const existing = await db.getFirstAsync('SELECT id FROM classrooms WHERE id = ?', [classroom.id]);
    if (existing) {
      await db.runAsync(
        'UPDATE classrooms SET name=?, teacher_id=?, teacher_name=?, max_capacity=? WHERE id=?',
        [classroom.name, classroom.teacher_id, classroom.teacher_name, classroom.max_capacity, classroom.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO classrooms (id, name, teacher_id, teacher_name, max_capacity, created_at) VALUES (?,?,?,?,?,?)',
        [classroom.id, classroom.name, classroom.teacher_id, classroom.teacher_name, classroom.max_capacity, classroom.created_at]
      );
    }
  } catch (error) { throw error; }
};

export const deleteClassroom = async (classroomId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('UPDATE children SET classroom_id = NULL WHERE classroom_id = ?', [classroomId]);
    await db.runAsync('DELETE FROM classrooms WHERE id = ?', [classroomId]);
  } catch (error) { throw error; }
};

export const updateChildClassroom = async (childId: string, classroomId: string | undefined): Promise<void> => {
  try {
      const db = await getDatabase();
      await db.runAsync('UPDATE children SET classroom_id = ? WHERE id = ?', [classroomId || null, childId]);
  } catch (e) { throw e; }
};