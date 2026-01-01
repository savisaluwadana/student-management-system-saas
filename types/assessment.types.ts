export type AssessmentType = 'exam' | 'quiz' | 'assignment' | 'project' | 'midterm' | 'final';

export interface Assessment {
    id: string;
    class_id: string;
    title: string;
    description: string | null;
    assessment_type: AssessmentType;
    max_score: number;
    weight: number;
    date: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface AssessmentWithClass extends Assessment {
    classes?: {
        id: string;
        class_code: string;
        class_name: string;
        subject: string;
    };
}

export interface CreateAssessmentInput {
    class_id: string;
    title: string;
    description?: string;
    assessment_type: AssessmentType;
    max_score?: number;
    weight?: number;
    date: string;
}

export interface UpdateAssessmentInput {
    title?: string;
    description?: string;
    assessment_type?: AssessmentType;
    max_score?: number;
    weight?: number;
    date?: string;
}

export interface Grade {
    id: string;
    assessment_id: string;
    student_id: string;
    score: number | null;
    remarks: string | null;
    graded_by: string | null;
    graded_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface GradeWithStudent extends Grade {
    students?: {
        id: string;
        student_code: string;
        full_name: string;
    };
}

export interface GradeInput {
    student_id: string;
    score: number | null;
    remarks?: string;
}

export interface BulkGradeInput {
    assessment_id: string;
    grades: GradeInput[];
}

export interface StudentClassGrade {
    student_id: string;
    student_code: string;
    student_name: string;
    class_id: string;
    class_name: string;
    subject: string;
    assessment_id: string;
    assessment_title: string;
    assessment_type: AssessmentType;
    max_score: number;
    weight: number;
    assessment_date: string;
    score: number | null;
    remarks: string | null;
    percentage: number;
}

export interface ClassAssessmentSummary {
    assessment_id: string;
    title: string;
    assessment_type: AssessmentType;
    max_score: number;
    date: string;
    class_id: string;
    class_name: string;
    graded_count: number;
    total_students: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    average_percentage: number;
}

export interface StudentForGrading {
    student_id: string;
    student_code: string;
    full_name: string;
    current_score?: number | null;
    current_remarks?: string | null;
}
