'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';
import { User, Course } from '@/lib/store';
import { useSession } from 'next-auth/react';

export default function StudentsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string;
  const canModify = ['admin', 'master'].includes(userRole);

  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [uRes, cRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/courses')
        ]);
        if (uRes.ok) {
          const allUsers: User[] = await uRes.json();
          setStudents(allUsers.filter(u => u.role === 'student'));
        }
        if (cRes.ok) setCourses(await cRes.json());
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Students Management" navItems={ADMIN_NAV_ITEMS}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Outfit' }}>Registered Students</h2>
          <div className="badge badge-blue">Total: {students.length}</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Student Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Batch</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Aadhaar No</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Payment Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Joined On</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-purple">{student.studentType || 'student'}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                      {student.batchId || 'No Batch'}
                    </code>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.aadhaarNo || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: student.paymentDetails?.remaining === 0 ? 'var(--success)' : 'var(--warning)' }}>
                        Pending: ₹{student.paymentDetails?.remaining?.toLocaleString() || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(student.assignedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
