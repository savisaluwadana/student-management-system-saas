export type EnrollmentStatus = 'active' | 'inactive' | 'completed' | 'dropped';

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  custom_fee: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEnrollmentInput {
  student_id: string;
  class_id: string;
  enrollment_date?: string;
  status?: EnrollmentStatus;
  custom_fee?: number;
  notes?: string;
}
