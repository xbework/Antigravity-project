'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { searchStaffs, type User } from '@/lib/store';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';
import { useSession } from 'next-auth/react';

export default function MastersPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string;
  const isMaster = userRole === 'master' || userRole === 'admin';
  const canView = ['admin', 'master'].includes(userRole);

  const [masters, setMasters] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    masterPriority: 'A1' as 'A1' | 'B1' | 'C1',
    linkedStaffId: '',
  });

  const [staffSearch, setStaffSearch] = useState('');
  const [foundStaffs, setFoundStaffs] = useState<User[]>([]);
  const [formError, setFormError] = useState('');

  const fetchMasters = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const allUsers: User[] = await res.json();
      // Filter for both role:master and role:staff with masterPriority
      setMasters(allUsers.filter(u => u.role === 'master' || (u.role === 'staff' && u.masterPriority)));
    }
  };

  useEffect(() => {
    fetchMasters();
  }, [showModal]);

  useEffect(() => {
    if (staffSearch.length > 1 && (formData.masterPriority === 'B1' || formData.masterPriority === 'C1')) {
      const matches = searchStaffs(staffSearch);
      setFoundStaffs(matches);
    } else {
      setFoundStaffs([]);
    }
  }, [staffSearch, formData.masterPriority]);

  const handlePriorityChange = (p: 'A1' | 'B1' | 'C1') => {
    setFormData({
      name: '',
      email: '',
      password: '',
      masterPriority: p,
      linkedStaffId: '',
    });
    setStaffSearch('');
    setFormError('');
  };

  const handleStaffSelect = (staff: User) => {
    setFormData(prev => ({
      ...prev,
      linkedStaffId: staff.id,
      name: staff.name,
      email: staff.email,
    }));
    setStaffSearch(staff.name);
    setFoundStaffs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'master', // Backend logic will convert to role:staff for A1 too if needed
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create master');
      }

      setShowModal(false);
      handlePriorityChange('A1'); // Reset
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (formData.masterPriority === 'A1') {
      return formData.name && formData.email && formData.password;
    } else {
      return formData.linkedStaffId && formData.password;
    }
  };

  const mastersA1 = masters.filter(m => m.masterPriority === 'A1');
  const mastersB1C1 = masters.filter(m => ['B1', 'C1'].includes(m.masterPriority || ''));

  if (session && !canView) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', color: '#fff' }}>
        <h1 style={{ fontFamily: 'Outfit', color: '#ff4d4d' }}>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Masters Management" navItems={ADMIN_NAV_ITEMS}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit' }}>Masters & Staff Hierarchy</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage high-level roles and staff elevations.</p>
        </div>
        {(userRole === 'admin' || userRole === 'master') && (
          <button className="btn-gradient" onClick={() => setShowModal(true)}>
            + Add Master
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Masters Table (A1) */}
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-purple">A1</span> Principal Masters (New Users)
          </h3>
          <Table users={mastersA1} />
        </section>

        {/* Staff-Linked Table (B1/C1) */}
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-cyan">B1/C1</span> Elevated Staff Members
          </h3>
          <Table users={mastersB1C1} showLinked />
        </section>
      </div>

      {/* Add Master Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem' }}>Add Master Privilege</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
              {/* 1. Priority Level (Top) */}
              <div>
                <label className="form-label">Priority Level</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['A1', 'B1', 'C1'] as const).map(p => (
                    <button 
                      key={p}
                      type="button" 
                      onClick={() => handlePriorityChange(p)}
                      className={formData.masterPriority === p ? 'btn-gradient' : 'btn-outline'}
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem', fontWeight: 500 }}>
                  {formData.masterPriority === 'A1' && 'A1 → "Create a new master user"'}
                  {(formData.masterPriority === 'B1' || formData.masterPriority === 'C1') && `${formData.masterPriority} → "Assign master access to existing staff"`}
                </p>
              </div>

              {/* 2. Dynamic Fields */}
              {formData.masterPriority === 'A1' ? (
                <>
                  <div>
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Email ID (Login)</label>
                    <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <label className="form-label">Link to Existing Staff</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search by name or email..." 
                      value={staffSearch}
                      onChange={e => setStaffSearch(e.target.value)}
                    />
                    {foundStaffs.length > 0 && (
                      <div className="glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {foundStaffs.map(s => (
                          <button 
                            key={s.id}
                            type="button"
                            onClick={() => handleStaffSelect(s)}
                            style={{ width: '100%', padding: '0.75rem', background: 'none', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                          >
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {formData.linkedStaffId && (
                      <div className="badge badge-green" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        Selected: {formData.name}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="form-label">Master Mode Password</label>
                <input type="password" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              {formError && (
                <div style={{ color: '#ff4d4d', fontSize: '0.85rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading || !isFormValid()}>
                  {loading ? 'Processing...' : 'Assign Master Mode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Table({ users, showLinked }: { users: User[], showLinked?: boolean }) {
  if (users.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No masters assigned yet.</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name</th>
            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role / Identifier</th>
            {showLinked && <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>}
            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Assigned Date</th>
            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Mode</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user.id}</div>
              </td>
              <td style={{ padding: '1rem' }}>
                <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--accent)' }}>
                  {user.role.toUpperCase()}
                </code>
                {user.masterPriority && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Priority: {user.masterPriority}
                  </div>
                )}
              </td>
              {showLinked && (
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>{user.email}</div>
                  <div className="badge badge-outline" style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Linked Staff</div>
                </td>
              )}
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                {user.assignedAt ? new Date(user.assignedAt).toLocaleDateString() : 'N/A'}
              </td>
              <td style={{ padding: '1rem' }}>
                 <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Authorized</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
