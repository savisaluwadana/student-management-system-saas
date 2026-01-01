export type ClassStatus = 'active' | 'inactive' | 'completed';

export interface Class {
  id: string;
  class_code: string;
  class_name: string;
  subject: string;
  description: string | null;
  teacher_id: string | null;
  schedule: string | null;
  monthly_fee: number;
  capacity: number;
  status: ClassStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClassInput {
  class_code: string;
  class_name: string;
  subject: string;
  description?: string;
  teacher_id?: string;
  schedule?: string;
  monthly_fee?: number;
  capacity?: number;
  status?: ClassStatus;
  start_date?: string;
  end_date?: string;
}

export interface UpdateClassInput {
  class_name?: string;
  subject?: string;
  description?: string;
  teacher_id?: string;
  schedule?: string;
  monthly_fee?: number;
  capacity?: number;
  status?: ClassStatus;
  start_date?: string;
  end_date?: string;
}
