'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createStudent, updateStudent } from '@/lib/actions/students';
import { getClasses } from '@/lib/actions/classes';
import { useToast } from '@/components/ui/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import type { Student, CreateStudentInput } from '@/types/student.types';
import type { Class } from '@/types/class.types';

interface StudentFormProps {
  student?: Student;
}

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);

  // Fetch classes on mount
  useState(() => {
    const fetchClasses = async () => {
      const data = await getClasses('active');
      setClasses(data);
    };
    fetchClasses();
  });

  const [formData, setFormData] = useState<CreateStudentInput>({
    student_code: student?.student_code || '',
    full_name: student?.full_name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    guardian_name: student?.guardian_name || '',
    guardian_phone: student?.guardian_phone || '',
    guardian_email: student?.guardian_email || '',
    date_of_birth: student?.date_of_birth || '',
    address: student?.address || '',
    joining_date: student?.joining_date || new Date().toISOString().split('T')[0],
    status: student?.status || 'active',
    notes: student?.notes || '',
    class_ids: [], // Should initialize with existing enrollments if editing, but for now empty or handle separately
  });

  // TODO: If editing, need to fetch existing enrollments to populate class_ids
  // This might require a separate useEffect or prop if not included in 'student' object

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (student) {
        // Update existing student
        const result = await updateStudent(student.id, formData);
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Student updated successfully',
          });
          router.push(`/students/${student.id}`);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to update student',
          });
        }
      } else {
        // Create new student
        const result = await createStudent(formData);
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Student created successfully',
          });
          router.push('/students');
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to create student',
          });
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="student_code">Student Code *</Label>
          <Input
            id="student_code"
            value={formData.student_code}
            onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
            required
            disabled={!!student}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian_name">Guardian Name</Label>
          <Input
            id="guardian_name"
            value={formData.guardian_name || ''}
            onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian_phone">Guardian Phone</Label>
          <Input
            id="guardian_phone"
            value={formData.guardian_phone || ''}
            onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian_email">Guardian Email</Label>
          <Input
            id="guardian_email"
            type="email"
            value={formData.guardian_email || ''}
            onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="joining_date">Joining Date *</Label>
          <Input
            id="joining_date"
            type="date"
            value={formData.joining_date || ''}
            onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'active'}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Classes</Label>
        <MultiSelect
          options={classes.map(c => ({ label: `${c.class_name} (${c.class_code})`, value: c.id }))}
          selected={formData.class_ids || []}
          onChange={(selected) => setFormData({ ...formData, class_ids: selected })}
          placeholder="Select classes..."
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : student ? 'Update Student' : 'Create Student'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
