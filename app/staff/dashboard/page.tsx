'use client';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { getLeads } from '@/lib/store';

import { STAFF_NAV_ITEMS } from '@/lib/roles';

export default function StaffDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Staff Member';

  return (
    <DashboardLayout title="Staff Dashboard" navItems={STAFF_NAV_ITEMS}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Outfit' }}>Welcome back, {userName}!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Check your daily schedule and manage your tasks.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Assigned Students" value="45" icon="👥" color="purple" />
        <StatCard label="Pending Tasks" value="8" icon="📝" color="orange" />
        <StatCard label="Attendance Rate" value="98%" icon="📅" trend="1%" trendUp color="cyan" />
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Today's Classes</h3>
        <p style={{ color: 'var(--text-muted)' }}>No classes scheduled for today.</p>
      </div>
    </DashboardLayout>
  );
}
