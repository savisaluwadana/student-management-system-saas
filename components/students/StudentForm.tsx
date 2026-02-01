'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createStudent, updateStudent } from '@/lib/actions/students';
import { getClasses } from '@/lib/actions/classes';
import { getInstitutes } from '@/lib/actions/institutes';
import { useToast } from '@/components/ui/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { Camera, Upload, X, User } from 'lucide-react';
import type { Student, CreateStudentInput, Gender } from '@/types/student.types';
import type { Class } from '@/types/class.types';

interface Institute {
  id: string;
  name: string;
  code: string;
}

interface StudentFormProps {
  student?: Student;
}

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photo_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    class_ids: student?.enrollments?.map(e => e.class.id) || [],
    // New fields
    institute_id: student?.institute_id || undefined,
    gender: student?.gender || undefined,
    school: student?.school || '',
    whatsapp_phone: student?.whatsapp_phone || '',
    photo_url: student?.photo_url || '',
  });

  // Fetch classes and institutes on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesData, institutesData] = await Promise.all([
          getClasses('active'),
          getInstitutes(),
        ]);
        setClasses(classesData);
        setInstitutes(institutesData);
      } catch (error) {
        console.error('Failed to load data', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load form data',
        });
      }
    };
    loadData();
  }, [toast]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        // In a real app, you'd upload to storage and get URL
        // For now, store base64 (not recommended for production)
        setFormData({ ...formData, photo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData({ ...formData, photo_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (student) {
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
      {/* Photo Upload Section */}
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="Student Photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <User className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            id="photo-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            {photoPreview ? 'Change' : 'Upload'} Photo
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
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
            <Label htmlFor="institute_id">Institute</Label>
            <Select
              value={formData.institute_id || ''}
              onValueChange={(value) => setFormData({ ...formData, institute_id: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select institute..." />
              </SelectTrigger>
              <SelectContent>
                {institutes.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender || ''}
              onValueChange={(value) => setFormData({ ...formData, gender: (value as Gender) || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="whatsapp_phone">WhatsApp Phone</Label>
          <Input
            id="whatsapp_phone"
            value={formData.whatsapp_phone || ''}
            onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
            placeholder="Include country code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Input
            id="school"
            value={formData.school || ''}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
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
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
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

