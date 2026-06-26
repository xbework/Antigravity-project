'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@/lib/store';
import DashboardLayout from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const users: User[] = await res.json();
          const found = users.find(u => u.id === id);
          if (found) setStudent(found);
        }
      } catch (error) {
        console.error('Failed to fetch student:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;
  if (!student) return <div style={{ padding: '2rem' }}>Student not found.</div>;

  return (
    <DashboardLayout title="Student Profile" navItems={ADMIN_NAV_ITEMS}>
      <div className="glass-card animate-fade" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: '2px solid var(--primary)' }}>
            {student.photo ? <img src={student.photo} alt="Student" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (student.name?.[0] || 'S')}
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{student.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Student ID: {student.id}</p>
            <div className="badge badge-purple" style={{ marginTop: '0.5rem' }}>Active Student</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Personal Information</h3>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Father's Name:</span> {student.fatherName || 'N/A'}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {student.email}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Aadhaar No:</span> {student.aadhaarNo || 'N/A'}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Address:</span> {student.address || 'N/A'}</div>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Academic/Professional</h3>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span style={{ textTransform: 'capitalize' }}>{student.studentType || 'N/A'}</span></div>
              {student.studentType === 'student' && <div><span style={{ color: 'var(--text-muted)' }}>School:</span> {student.schoolName}</div>}
              {student.studentType === 'working' && (
                <>
                  <div><span style={{ color: 'var(--text-muted)' }}>Company:</span> {student.companyName}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Position:</span> {student.position}</div>
                </>
              )}
              <div><span style={{ color: 'var(--text-muted)' }}>Qualification:</span> {student.qualifications || 'N/A'}</div>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Course & Financials</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Course Fee</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>₹{student.paymentDetails?.feeOfCourse?.toLocaleString() || 0}</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admission Fee</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>₹{student.paymentDetails?.admissionFee?.toLocaleString() || 0}</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Discount</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fb923c' }}>- ₹{student.paymentDetails?.discount?.toLocaleString() || 0}</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--gradient-primary)', borderRadius: '8px', color: '#fff', gridColumn: 'span 3' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Payable</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{((student.paymentDetails?.feeOfCourse || 0) + (student.paymentDetails?.admissionFee || 0) - (student.paymentDetails?.discount || 0)).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
          <button className="btn-outline" onClick={() => router.push('/admin/dashboard')}>Back to Dashboard</button>
          <button className="btn-gradient">Print Application</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
