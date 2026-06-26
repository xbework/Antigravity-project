'use client';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';

const NAV_ITEMS = [
  { icon: '🏠', label: 'My Dashboard', href: '/student/dashboard' },
  { icon: '📚', label: 'My Courses', href: '/student/courses' },
  { icon: '📝', label: 'Attendance', href: '/student/attendance' },
  { icon: '🏆', label: 'Certificates', href: '/student/certificates' },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout title="My Progress" navItems={NAV_ITEMS}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Overall Progress" value="68%" icon="📈" color="purple" trend="5%" trendUp />
        <StatCard label="Classes Attended" value="24/28" icon="📅" color="cyan" />
        <StatCard label="Assignments" value="12" icon="📝" color="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Current Courses</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { name: 'Advanced UI/UX Principles', progress: 85, color: 'var(--primary)' },
              { name: 'Mastering Framer Motion', progress: 40, color: 'var(--accent)' },
              { name: 'Portfolio Development', progress: 15, color: '#22C55E' },
            ].map((course, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600 }}>{course.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{course.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${course.progress}%`, height: '100%', background: course.color, borderRadius: '10px', transition: 'width 1s ease-out' }} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn-outline" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>View All Courses</button>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Upcoming Sessions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { title: 'UX Research Methods', date: 'Tomorrow, 10:00 AM', type: 'Live Workshop' },
              { title: 'Project Review', date: 'Mar 18, 2:30 PM', type: 'Mentorship' },
              { title: 'Web Design Fundamentals', date: 'Mar 19, 9:00 AM', type: 'Lecture' },
            ].map((session, i) => (
              <div key={i} style={{ padding: '1rem', borderLeft: '3px solid var(--primary)', background: 'rgba(255,255,255,0.02)', borderRadius: '0 8px 8px 0' }}>
                <p style={{ fontWeight: 600 }}>{session.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{session.date} • {session.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
