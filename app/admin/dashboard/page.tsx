'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';
import { Lead, Course } from '@/lib/store';

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, coursesRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/courses')
        ]);
        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (coursesRes.ok) setCourses(await coursesRes.json());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalRevenue = leads.filter(l => l.status === 'Registered').length * 1500; // Mock calculation

  return (
    <DashboardLayout title="Admin Overview" navItems={ADMIN_NAV_ITEMS}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Registered Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="💰" trend="Live" trendUp color="green" />
        <StatCard label="Total Inquiries" value={leads.length.toString()} icon="👤" color="purple" />
        <StatCard label="Active Courses" value={courses.length.toString()} icon="🎓" color="cyan" />
        <StatCard label="Server Status" value="Online" icon="⚡" color="orange" />
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Recent Inquiries</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Student</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Interested In</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 5).map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {lead.name}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    <span className={`badge ${lead.category === 'Tuition' ? 'badge-blue' : 'badge-purple'}`} style={{ marginRight: '0.5rem' }}>
                      {lead.category}
                    </span>
                    {lead.lookingFor}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-cyan">{lead.status}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
