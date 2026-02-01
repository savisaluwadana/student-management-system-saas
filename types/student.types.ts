export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated';
export type Gender = 'male' | 'female' | 'other';

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
  // New fields
  institute_id: string | null;
  gender: Gender | null;
  school: string | null;
  whatsapp_phone: string | null;
  barcode: string | null;
  photo_url: string | null;
  enrollments?: {
    class: {
      id: string;
      class_name: string;
      class_code: string;
    };
  }[];
  institute?: {
    id: string;
    name: string;
    code: string;
  };
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
  // New fields
  institute_id?: string;
  gender?: Gender;
  school?: string;
  whatsapp_phone?: string;
  photo_url?: string;
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
  // New fields
  institute_id?: string;
  gender?: Gender;
  school?: string;
  whatsapp_phone?: string;
  photo_url?: string;
}

