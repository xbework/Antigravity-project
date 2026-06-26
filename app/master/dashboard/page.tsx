'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { MASTER_NAV_ITEMS } from '@/lib/roles';
import { Lead } from '@/lib/store';

export default function MasterDashboard() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const masterCategory = (session?.user as any)?.priority || 'A1';

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads');
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  return (
    <DashboardLayout title={`Master Control Hub - [${masterCategory}]`} navItems={MASTER_NAV_ITEMS}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Total Leads" value={leads.length.toString()} icon="👤" trend="Live" trendUp color="cyan" />
        <StatCard label="Active Staffs" value="0" icon="👥" color="purple" />
        {masterCategory !== 'C1' && <StatCard label="Monthly Payouts" value="₹0" icon="💰" color="green" />}
        <StatCard label="Staff Attendance" value="0%" icon="📅" color="orange" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: masterCategory === 'C1' ? '1fr' : '1.5fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Staff Daily Tracking Placeholder */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Staff Daily Tracking</h3>
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No staff members active in your shift.
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Outfit' }}>Recent Student Leads</h3>
            <button className="btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => window.location.href='/master/leads'}>View All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Category</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{lead.name}</td>
                    <td style={{ padding: '1rem' }}>
                       <span className={`badge ${lead.category === 'Tuition' ? 'badge-blue' : 'badge-purple'}`}>
                        {lead.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{lead.status}</span>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && !loading && (
                   <tr>
                     <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No inquiries yet.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
