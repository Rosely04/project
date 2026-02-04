import { getDatabase } from './database';
import { Child, Worker, Payment, Classroom } from '../src/types';

// HELPERS (Validaciones de fechas y reglas)

const DAYS_30_IN_MS = 30 * 24 * 60 * 60 * 1000;

const hasPassed30Days = (dateString: string | null | undefined): boolean => {
  if (!dateString) return true; 
  const date = new Date(dateString);
  const now = new Date();
  if (isNaN(date.getTime())) return true;
  return (now.getTime() - date.getTime()) >= DAYS_30_IN_MS;
};

const getMonthsWorked = (hireDateStr: string): number => {
  const hireDate = new Date(hireDateStr);
  const now = new Date();
  if (isNaN(hireDate.getTime()) || hireDate > now) return 0;
  const diffTime = Math.abs(now.getTime() - hireDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 30) + 1; 
};

// CHILDREN FUNCTIONS

export const getChildren = async (): Promise<Child[]> => {
  try {
    const db = await getDatabase();
    const children = await db.getAllAsync<any>(
      'SELECT * FROM children ORDER BY created_at DESC'
    );

    const updatedChildren = await Promise.all(children.map(async (row) => {
      let updates: string[] = [];
      let updateValues: any[] = [];
      let finalHasPaid = Boolean(row.has_paid);
      let finalHasAseo = Boolean(row.has_aseo);

      if (row.has_paid === 1) {
        const lastPayment = await db.getFirstAsync<{ payment_date: string }>(
          'SELECT payment_date FROM payments WHERE child_id = ? ORDER BY payment_date DESC LIMIT 1',
          [row.id]
        );
        if (!lastPayment || hasPassed30Days(lastPayment.payment_date)) {
          finalHasPaid = false;
          updates.push('has_paid = 0');
        }
      }

      if (row.has_aseo === 1) {
        if (!row.last_aseo_date || hasPassed30Days(row.last_aseo_date)) {
          finalHasAseo = false;
          updates.push('has_aseo = 0');
        }
      }

      if (updates.length > 0) {
        updateValues.push(row.id);
        await db.runAsync(
          `UPDATE children SET ${updates.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

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

    // 1. NUEVO: Validar si el teléfono del padre coincide con el de un TRABAJADOR
    // Si un maestro tiene el número 5555, un padre no puede registrarse con el 5555
    const workerCheck = await db.getFirstAsync(
      'SELECT id FROM workers WHERE phone = ? LIMIT 1', 
      [child.parent_phone]
    );
    if (workerCheck) throw new Error('El teléfono del padre coincide con el de un trabajador del centro.');

    // 2. Validación de duplicado de hijo (Misma logica de siempre)
    const duplicateCheck = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM children WHERE name = ? AND parent_name = ? AND id != ?`,
      [child.name.trim(), child.parent_name.trim(), child.id]
    );

    if (duplicateCheck) {
      throw new Error(`El padre "${child.parent_name}" ya tiene un hijo registrado como "${child.name}".`);
    }

    // Guardado (Update o Insert)
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

// BORRADO SIMPLIFICADO: La DB se encarga de borrar pagos y aseo
export const deleteChild = async (childId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM children WHERE id = ?', [childId]);
  } catch (error) {
    console.error('Error deleting child:', error);
    throw error;
  }
};

// FINANCIAL & WORKERS

export const getFinancialSummary = async () => {
  try {
    const db = await getDatabase();
    // Ingresos
    const incomeResult = await db.getFirstAsync<{ total: number }>('SELECT SUM(amount) as total FROM payments');
    const totalRevenue = incomeResult?.total || 0;

    // Gastos (Calculado solo con workers activos)
    const workers = await db.getAllAsync<Worker>('SELECT salary, hire_date FROM workers');
    let totalSalariesExpenses = 0;
    
    workers.forEach(worker => {
      const months = getMonthsWorked(worker.hire_date);
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

    // 1. Validar si otro TRABAJADOR tiene ese número
    const phoneCheck = await db.getFirstAsync(
      'SELECT id FROM workers WHERE phone = ? AND id != ?', 
      [worker.phone, worker.id]
    );
    if (phoneCheck) throw new Error('El teléfono ya está registrado por otro trabajador.');

    // 2. NUEVO: Validar si algún PADRE (en tabla children) tiene ese número
    const parentPhoneCheck = await db.getFirstAsync(
      'SELECT id FROM children WHERE parent_phone = ? LIMIT 1', 
      [worker.phone]
    );
    if (parentPhoneCheck) throw new Error('El teléfono no puede ser igual al de un padre de familia.');

    // 3. Validar email duplicado
    if (worker.email) {
      const emailCheck = await db.getFirstAsync('SELECT id FROM workers WHERE email = ? AND id != ?', [worker.email, worker.id]);
      if (emailCheck) throw new Error('Email ya registrado.');
    }

    // Guardado (Update o Insert)
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

// --- AQUÍ ESTÁ EL CAMBIO SOLICITADO ---
export const deleteWorker = async (workerId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    
    // Primero, limpiamos manualmente el 'teacher_name' en las aulas
    // SQLite borrará el 'teacher_id' automáticamente (SET NULL), 
    // pero debemos quitar el texto del nombre para que la UI lo vea vacío.
    await db.runAsync(
      'UPDATE classrooms SET teacher_id = NULL, teacher_name = "" WHERE teacher_id = ?', 
      [workerId]
    );

    // Luego borramos el trabajador
    await db.runAsync('DELETE FROM workers WHERE id = ?', [workerId]);
  } catch (error) { throw error; }
};
// -------------------------------------

// PAYMENTS

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Payment>('SELECT * FROM payments ORDER BY payment_date DESC, created_at DESC');
  } catch (error) { return []; }
};

export const savePayment = async (payment: Payment): Promise<void> => {
  try {
    const db = await getDatabase();
    const lastPayment = await db.getFirstAsync<{ payment_date: string }>(
      'SELECT payment_date FROM payments WHERE child_id = ? ORDER BY payment_date DESC LIMIT 1',
      [payment.child_id]
    );

    if (lastPayment && !hasPassed30Days(lastPayment.payment_date)) {
      throw new Error('Este niño ya tiene un pago registrado en los últimos 30 días.');
    }

    await db.runAsync(
      'INSERT INTO payments (id, child_id, child_name, amount, payment_date, description, created_at) VALUES (?,?,?,?,?,?,?)',
      [payment.id, payment.child_id, payment.child_name, payment.amount, payment.payment_date, payment.description, payment.created_at]
    );
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

// ASEO

export const updateChildAseoStatus = async (childId: string, hasAseo: boolean): Promise<void> => {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (hasAseo) {
      const child = await db.getFirstAsync<{ last_aseo_date: string }>('SELECT last_aseo_date FROM children WHERE id = ?', [childId]);
      if (child && child.last_aseo_date && !hasPassed30Days(child.last_aseo_date)) {
        throw new Error('Ya se registró aseo en los últimos 30 días.');
      }
      await db.runAsync('UPDATE children SET has_aseo = 1, last_aseo_date = ? WHERE id = ?', [now, childId]);
    } else {
      await db.runAsync('UPDATE children SET has_aseo = 0 WHERE id = ?', [childId]);
    }
  } catch (error) {
    console.error('Error aseo:', error);
    throw error;
  }
};

// CLASSROOMS

export const getClassrooms = async (): Promise<Classroom[]> => {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Classroom>('SELECT * FROM classrooms ORDER BY created_at DESC');
  } catch (error) { return []; }
};

export const saveClassroom = async (classroom: Classroom): Promise<void> => {
  try {
    const db = await getDatabase();
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

// BORRADO SIMPLIFICADO: La DB actualiza niños a NULL automáticamente
export const deleteClassroom = async (classroomId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM classrooms WHERE id = ?', [classroomId]);
  } catch (error) { throw error; }
};

export const updateChildClassroom = async (childId: string, classroomId: string | undefined): Promise<void> => {
  try {
      const db = await getDatabase();
      await db.runAsync('UPDATE children SET classroom_id = ? WHERE id = ?', [classroomId || null, childId]);
  } catch (e) { throw e; }
};