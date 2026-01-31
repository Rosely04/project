import { getDatabase } from './database';
import { Child, Worker, Payment, Classroom } from '../types';

// Children functions
export const getChildren = async (): Promise<Child[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Child>(
      'SELECT * FROM children ORDER BY created_at DESC'
    );

    return result.map(row => ({
      ...row,
      has_paid: Boolean(row.has_paid),
      has_aseo: Boolean(row.has_aseo),
    }));
  } catch (error) {
    console.error('Error getting children:', error);
    return [];
  }
};

export const saveChild = async (child: Child): Promise<void> => {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM children WHERE id = ?',
      [child.id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE children SET
          name = ?,
          age = ?,
          parent_name = ?,
          parent_phone = ?,
          address = ?,
          has_paid = ?,
          has_aseo = ?,
          classroom_id = ?
        WHERE id = ?`,
        [
          child.name,
          child.age,
          child.parent_name,
          child.parent_phone,
          child.address,
          child.has_paid ? 1 : 0,
          child.has_aseo ? 1 : 0,
          child.classroom_id || null,
          child.id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO children (
          id, name, age, parent_name, parent_phone, address,
          has_paid, has_aseo, classroom_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          child.id,
          child.name,
          child.age,
          child.parent_name,
          child.parent_phone,
          child.address,
          child.has_paid ? 1 : 0,
          child.has_aseo ? 1 : 0,
          child.classroom_id || null,
          child.created_at,
        ]
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

// Workers functions
export const getWorkers = async (): Promise<Worker[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Worker>(
      'SELECT * FROM workers ORDER BY created_at DESC'
    );
    return result;
  } catch (error) {
    console.error('Error getting workers:', error);
    return [];
  }
};

export const saveWorker = async (worker: Worker): Promise<void> => {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM workers WHERE id = ?',
      [worker.id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE workers SET
          name = ?,
          position = ?,
          phone = ?,
          email = ?,
          salary = ?,
          hire_date = ?
        WHERE id = ?`,
        [
          worker.name,
          worker.position,
          worker.phone,
          worker.email || '',
          worker.salary,
          worker.hire_date,
          worker.id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO workers (
          id, name, position, phone, email, salary, hire_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          worker.id,
          worker.name,
          worker.position,
          worker.phone,
          worker.email || '',
          worker.salary,
          worker.hire_date,
          worker.created_at,
        ]
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
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw error;
  }
};

// Payments functions
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Payment>(
      'SELECT * FROM payments ORDER BY payment_date DESC, created_at DESC'
    );
    return result;
  } catch (error) {
    console.error('Error getting payments:', error);
    return [];
  }
};

export const savePayment = async (payment: Payment): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.runAsync(
      `INSERT INTO payments (
        id, child_id, child_name, amount, payment_date, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.id,
        payment.child_id,
        payment.child_name,
        payment.amount,
        payment.payment_date,
        payment.description,
        payment.created_at,
      ]
    );

    await db.runAsync(
      'UPDATE children SET has_paid = 1 WHERE id = ?',
      [payment.child_id]
    );
  } catch (error) {
    console.error('Error saving payment:', error);
    throw error;
  }
};

export const updateChildPaymentStatus = async (childId: string, hasPaid: boolean): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE children SET has_paid = ? WHERE id = ?',
      [hasPaid ? 1 : 0, childId]
    );
  } catch (error) {
    console.error('Error updating child payment status:', error);
    throw error;
  }
};

export const updateChildAseoStatus = async (childId: string, hasAseo: boolean): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE children SET has_aseo = ? WHERE id = ?',
      [hasAseo ? 1 : 0, childId]
    );
  } catch (error) {
    console.error('Error updating child aseo status:', error);
    throw error;
  }
};

export const updateChildClassroom = async (childId: string, classroomId: string | undefined): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE children SET classroom_id = ? WHERE id = ?',
      [classroomId || null, childId]
    );
  } catch (error) {
    console.error('Error updating child classroom:', error);
    throw error;
  }
};

// Classrooms functions
export const getClassrooms = async (): Promise<Classroom[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Classroom>(
      'SELECT * FROM classrooms ORDER BY created_at DESC'
    );
    return result;
  } catch (error) {
    console.error('Error getting classrooms:', error);
    return [];
  }
};

export const saveClassroom = async (classroom: Classroom): Promise<void> => {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM classrooms WHERE id = ?',
      [classroom.id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE classrooms SET
          name = ?,
          teacher_id = ?,
          teacher_name = ?,
          max_capacity = ?
        WHERE id = ?`,
        [
          classroom.name,
          classroom.teacher_id,
          classroom.teacher_name,
          classroom.max_capacity,
          classroom.id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO classrooms (
          id, name, teacher_id, teacher_name, max_capacity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          classroom.id,
          classroom.name,
          classroom.teacher_id,
          classroom.teacher_name,
          classroom.max_capacity,
          classroom.created_at,
        ]
      );
    }
  } catch (error) {
    console.error('Error saving classroom:', error);
    throw error;
  }
};

export const deleteClassroom = async (classroomId: string): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.runAsync(
      'UPDATE children SET classroom_id = NULL WHERE classroom_id = ?',
      [classroomId]
    );

    await db.runAsync('DELETE FROM classrooms WHERE id = ?', [classroomId]);
  } catch (error) {
    console.error('Error deleting classroom:', error);
    throw error;
  }
};
