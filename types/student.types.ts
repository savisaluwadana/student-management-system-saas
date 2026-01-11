export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated';

export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  date_of_birth: string | null;
  address: string | null;
  joining_date: string;
  status: StudentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentInput {
  student_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  date_of_birth?: string;
  address?: string;
  joining_date?: string;
  status?: StudentStatus;
  notes?: string;
  class_ids?: string[];
}

export interface UpdateStudentInput {
  full_name?: string;
  email?: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  date_of_birth?: string;
  address?: string;
  joining_date?: string;
  status?: StudentStatus;
  notes?: string;
  class_ids?: string[];
}
