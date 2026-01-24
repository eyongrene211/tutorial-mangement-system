'use client';

import { useState, useEffect } from 'react';
import { IconX }               from '@tabler/icons-react';
import toast                   from 'react-hot-toast';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  classLevel: string;
}

interface Grade {
  _id: string;
  student: Student | string;
  subject: string;
  testName: string;
  testDate: string;
  score: number;
  maxScore: number;
  testType: string;
  notes?: string;
}

interface GradeModalProps {
  student?: Student;
  grade?: Grade;
  onClose: () => void;
  onSave: () => void;
}

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'French',
  'Biology',
  'History',
  'Geography',
];

const TEST_TYPES = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'exam', label: 'Exam' },
  { value: 'homework', label: 'Homework' },
  { value: 'assignment', label: 'Assignment' },
];

export function GradeModal({ student, grade, onClose, onSave }: GradeModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    subject: 'Mathematics',
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    score: '',
    maxScore: '20',
    testType: 'quiz',
    notes: '',
  });

  useEffect(() => {
    fetchStudents();

    // ✅ Initialize form data
    if (grade) {
      // Extract student ID properly
      const studentId = typeof grade.student === 'string' 
        ? grade.student 
        : grade.student?._id || '';

      setFormData({
        studentId: studentId,
        subject: grade.subject,
        testName: grade.testName,
        testDate: grade.testDate.split('T')[0],
        score: grade.score.toString(),
        maxScore: grade.maxScore.toString(),
        testType: grade.testType,
        notes: grade.notes || '',
      });
    } else if (student) {
      // Pre-select student if passed
      setFormData((prev) => ({
        ...prev,
        studentId: student._id,
      }));
    }
  }, [grade, student]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch('/api/students?status=active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch students');
      }

      const studentsArray = Array.isArray(data) ? data : data.students || [];
      
      // ✅ Filter out invalid students
      const validStudents = studentsArray.filter(
        (s: Student) => s && s._id && s.firstName && s.lastName
      );
      
      setStudents(validStudents);
      
      if (validStudents.length === 0) {
        setError('No active students found. Please add students first.');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ Comprehensive validation
      if (!formData.studentId) {
        setError('Please select a student');
        setLoading(false);
        return;
      }

      if (!formData.subject) {
        setError('Please select a subject');
        setLoading(false);
        return;
      }

      if (!formData.testName || formData.testName.trim() === '') {
        setError('Please enter a test name');
        setLoading(false);
        return;
      }

      if (!formData.testDate) {
        setError('Please select a test date');
        setLoading(false);
        return;
      }

      if (!formData.score || formData.score === '') {
        setError('Please enter a score');
        setLoading(false);
        return;
      }

      if (!formData.maxScore || formData.maxScore === '') {
        setError('Please enter maximum score');
        setLoading(false);
        return;
      }

      const score = parseFloat(formData.score);
      const maxScore = parseFloat(formData.maxScore);

      if (isNaN(score) || isNaN(maxScore)) {
        setError('Score and max score must be valid numbers');
        setLoading(false);
        return;
      }

      if (score < 0 || maxScore <= 0) {
        setError('Score must be positive and max score must be greater than 0');
        setLoading(false);
        return;
      }

      if (score > maxScore) {
        setError('Score cannot be greater than max score');
        setLoading(false);
        return;
      }

      // ✅ Build payload with all required fields
      const payload = {
        student: formData.studentId,
        subject: formData.subject,
        testName: formData.testName.trim(),
        testDate: formData.testDate,
        score: score,
        maxScore: maxScore,
        testType: formData.testType,
        notes: formData.notes.trim() || undefined,
      };

      console.log('📤 Sending grade payload:', payload);

      const url = grade ? `/api/grades/${grade._id}` : '/api/grades';
      const method = grade ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log('📥 Received response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save grade');
      }

      toast.success(
        grade ? 'Grade updated successfully! ✅' : 'Grade added successfully! ✅'
      );

      onSave();
    } catch (err) {
      console.error('❌ Error saving grade:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  // Calculate percentage in real-time
  const calculatePercentage = () => {
    const score = parseFloat(formData.score);
    const maxScore = parseFloat(formData.maxScore);
    if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
      return Math.round((score / maxScore) * 100);
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {grade ? 'Edit Grade' : 'Add New Grade'}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              <IconX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={loading || loadingStudents || !!student}
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">-- Select Student --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} - {s.classLevel}
                  </option>
                ))}
              </select>
              {loadingStudents && (
                <p className="mt-1 text-xs text-gray-500">Loading students...</p>
              )}
              {student && (
                <p className="mt-1 text-xs text-gray-500">
                  Student is pre-selected and cannot be changed
                </p>
              )}
            </div>

            {/* Subject and Test Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={loading}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={loading}
                  value={formData.testType}
                  onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {TEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="e.g., Mid-term Exam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={loading}
                  value={formData.testDate}
                  onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            {/* Score Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Score <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  disabled={loading}
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Score <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  disabled={loading}
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="20"
                />
              </div>
            </div>

            {/* Percentage Display */}
            {formData.score && formData.maxScore && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Percentage:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {calculatePercentage()}%
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                disabled={loading}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                placeholder="Additional notes about the test..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || students.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{grade ? 'Update Grade' : 'Add Grade'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
