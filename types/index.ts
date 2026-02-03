export interface Child {
  id: string;
  name: string;
  age: number;
  parent_name: string;
  parent_phone: string;
  address: string;
  has_paid: boolean;
  has_aseo: boolean;
  last_payment_month?: string;
  classroom_id?: string;
  created_at: string;
}

export interface Worker {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  salary: number;
  hire_date: string;
  created_at: string;
}

export interface Payment {
  id: string;
  child_id: string;
  child_name: string;
  amount: number;
  payment_date: string;
  description: string;
  created_at: string;
}

export interface PaymentFilters {
  paid: boolean | null;
}

export interface Classroom {
  id: string;
  name: string;
  teacher_id: string;
  teacher_name: string;
  max_capacity: number;
  created_at: string;
}