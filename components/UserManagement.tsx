'use client';
import { useState, useEffect } from 'react';
import { ROLES, type Role } from '@/lib/roles';
import { User } from '@/lib/store';

interface UserManagementProps {
  currentRole: Role;
}

export default function UserManagement({ currentRole }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [jobTitles, setJobTitles] = useState<any[]>([]);

  // View User State
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});
  const [activeTab, setActiveTab] = useState('profile');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    masterPriority: 'A1' as 'A1' | 'B1' | 'C1',
    linkedStaffId: '',
    appointedAs: '',
    exactDuty: '',
    course: '',
  });

  const [formError, setFormError] = useState('');

  const [staffSearch, setStaffSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/job-titles').then(res => res.json()).then(data => {
      // In case api returns an error object, check if it's array
      if (Array.isArray(data)) setJobTitles(data);
    }).catch(err => console.error(err));
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Removed fields to abridge context
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: modalType,
          masterPriority: modalType === ROLES.MASTER ? formData.masterPriority : undefined,
          masterPassword: modalType === ROLES.MASTER ? formData.password : undefined,
          linkedStaffId: (modalType === ROLES.MASTER && formData.masterPriority !== 'A1') ? formData.linkedStaffId : undefined,
          appointedAs: modalType === ROLES.STAFF ? formData.appointedAs : undefined,
          exactDuty: modalType === ROLES.STAFF ? formData.exactDuty : undefined,
          course: modalType === ROLES.STUDENT ? formData.course : undefined,
          avatar: formData.name.charAt(0).toUpperCase(),
        }),
      });

      if (res.ok) {
        await fetchUsers();
        setShowModal(false);
        setModalType(null);
        setFormData({ name: '', email: '', password: '', masterPriority: 'A1', linkedStaffId: '', appointedAs: '', exactDuty: '', course: '' });
        setFormError('');
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewUser) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${viewUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setViewUser(updatedUser);
        await fetchUsers(); // Refresh background list
      }
    } catch (error) {
      console.error('Failed to update user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateMaster = currentRole === ROLES.ADMIN;
  const canCreateStaff = currentRole === ROLES.ADMIN || currentRole === ROLES.MASTER;
  const canRegisterStudent = currentRole === ROLES.ADMIN || currentRole === ROLES.MASTER;

  const filteredUsers = filter === 'all' ? users : users.filter(u => {
    if (filter === ROLES.MASTER) {
      return u.role === ROLES.MASTER || (u.role === ROLES.STAFF && u.masterPriority);
    }
    return u.role === filter;
  });
  const foundStaffs = staffSearch.length > 1 
    ? users.filter(u => u.role === ROLES.STAFF && (u.name.toLowerCase().includes(staffSearch.toLowerCase()) || u.email.toLowerCase().includes(staffSearch.toLowerCase())))
    : [];

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', ROLES.MASTER, ROLES.STAFF, ROLES.STUDENT].map(r => (
            <button 
              key={r}
              onClick={() => setFilter(r)}
              className={filter === r ? 'badge badge-purple' : 'badge badge-outline'}
              style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}s
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {canCreateMaster && (
            <button className="btn-gradient" onClick={() => { setModalType(ROLES.MASTER); setShowModal(true); }}>
              + Add Master Info
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>User</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Details</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Joined</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.7rem' }}>
                        {user.avatar || user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${user.role === 'admin' ? 'purple' : user.role === 'master' ? 'cyan' : user.role === 'staff' ? 'orange' : 'green'}`}>
                      {user.role}
                    </span>
                    {user.role === ROLES.STAFF && (user as any).masterPriority && (
                      <span className="badge badge-cyan" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>MASTER</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {(user.role === ROLES.MASTER || (user as any).masterPriority) && `Priority: ${(user as any).masterPriority}`}
                    {user.role === ROLES.STAFF && (user.appointedAs ? ` • Appointed: ${user.appointedAs}` : '')}
                    {user.role === ROLES.STUDENT && (user.course ? `Course: ${user.course}` : 'Enrolled')}
                    {user.role === ROLES.ADMIN && 'System Access'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(user.assignedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Active</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      className="btn-outline" 
                      style={{ padding: '0.3rem 0.6rem' }} 
                      onClick={() => {
                        setViewUser(user);
                        setShowDetails(false);
                        setActiveTab('profile');
                        setEditUserForm({
                          name: user.name || '',
                          email: user.email || '',
                          password: user.password || '',
                          appointedAs: user.appointedAs || '',
                          exactDuty: user.exactDuty || '',
                          masterPriority: user.masterPriority || 'A1',
                          linkedStaffId: user.linkedStaffId || '',
                          avatar: user.avatar || '',
                          address: user.address || '',
                          qualifications: user.qualifications || '',
                          extraSkills: user.extraSkills || '',
                          course: user.course as any
                        });
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !fetching && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Create User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem' }}>
              {modalType === ROLES.MASTER ? 'Add Master Info' : modalType === ROLES.STAFF ? 'Add Staff Member' : 'Register New Student'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
              {/* 1. Priority Level (FIRST for Masters) */}
              {modalType === ROLES.MASTER && (
                <div>
                  <label className="form-label">Priority Level</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['A1', 'B1', 'C1'] as const).map(p => (
                      <button 
                        key={p}
                        type="button" 
                        onClick={() => {
                          setFormData({ ...formData, masterPriority: p, name: '', email: '', password: '', linkedStaffId: '' });
                          setFormError('');
                        }}
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
              )}

              {/* 2. Staff Selection or Name Input */}
              {modalType === ROLES.MASTER && formData.masterPriority !== 'A1' ? (
                <div style={{ position: 'relative' }}>
                  <label className="form-label">Select Staff to Link</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search by Name or Email..." 
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                  />
                  {foundStaffs.length > 0 && (
                    <div className="glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                      {foundStaffs.map(s => (
                        <button 
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, linkedStaffId: s.id, name: s.name, email: s.email});
                            setStaffSearch(s.name);
                          }}
                          style={{ width: '100%', padding: '0.75rem', background: 'none', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
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
                      Linked: {formData.name} ({formData.email})
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">{modalType === ROLES.MASTER ? 'Master Email ID' : 'Email / User ID'}</label>
                    <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </>
              )}

              {/* 3. Password Fields */}
              <div>
                <label className="form-label">{modalType === ROLES.MASTER ? 'Master Access Password' : 'Temporary Password'}</label>
                <input type="password" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              {modalType === ROLES.STAFF && (
                <>
                  <div>
                    <label className="form-label">Appointed As</label>
                    <select 
                      className="form-input" 
                      style={{ backgroundColor: '#111', color: 'white' }} 
                      required 
                      value={formData.appointedAs} 
                      onChange={e => setFormData({...formData, appointedAs: e.target.value})}
                    >
                      <option value="">Select Role/Specialization...</option>
                      {jobTitles.map(j => (
                        <option key={j.id} value={j.titleName}>{j.titleName}</option>
                      ))}
                    </select>
                  </div>

                  {modalType === ROLES.STAFF && (
                    <div>
                      <label className="form-label">Exact Duty (e.g. Physics Teacher, UI Designer)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Graphic, Web (use comma for multiple)" 
                        value={formData.exactDuty} 
                        onChange={e => setFormData({...formData, exactDuty: e.target.value})} 
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Separate multiple duties by commas (",")</small>
                    </div>
                  )}
                </>
              )}

              {modalType === ROLES.STUDENT && (
                <div>
                  <label className="form-label">Course</label>
                  <select 
                    className="form-input" 
                    style={{ backgroundColor: '#111', color: 'white' }} 
                    required 
                    value={formData.course} 
                    onChange={e => setFormData({...formData, course: e.target.value})}
                  >
                    <option value="">Select Course...</option>
                    <option value="Tuition">Tuition</option>
                    <option value="Technical courses">Technical courses</option>
                  </select>
                </div>
              )}


              {formError && (
                <div style={{ color: '#ff4d4d', fontSize: '0.8rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                  {viewUser.avatar || viewUser.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit', margin: 0 }}>{viewUser.name}</h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{viewUser.email} • {viewUser.role.toUpperCase()}</div>
                </div>
              </div>
              <button className="btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setViewUser(null)}>Close</button>
            </div>

            {!showDetails ? (
              <form onSubmit={handleUpdateUserDetails} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" required value={editUserForm.name || ''} onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label">Email / User ID</label>
                    <input type="email" className="form-input" required value={editUserForm.email || ''} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label">Password</label>
                    <input type="text" className="form-input" placeholder="Leave blank to keep unchanged" value={editUserForm.password || ''} onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })} />
                  </div>

                  {viewUser.role === ROLES.STAFF && (
                    <div>
                      <label className="form-label">Appointed As</label>
                      <select 
                        className="form-input" 
                        style={{ backgroundColor: '#111', color: 'white' }} 
                        value={editUserForm.appointedAs || ''} 
                        onChange={e => setEditUserForm({...editUserForm, appointedAs: e.target.value})}
                      >
                        <option value="">Select Role/Specialization...</option>
                        {jobTitles.map(j => (
                          <option key={j.id} value={j.titleName}>{j.titleName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {viewUser.role === ROLES.STUDENT && (
                    <div>
                      <label className="form-label">Course</label>
                      <select 
                        className="form-input" 
                        style={{ backgroundColor: '#111', color: 'white' }} 
                        value={editUserForm.course || ''} 
                        onChange={e => setEditUserForm({...editUserForm, course: e.target.value as any})}
                      >
                        <option value="">Select Course...</option>
                        <option value="Tuition">Tuition</option>
                        <option value="Technical courses">Technical courses</option>
                      </select>
                    </div>
                  )}

                  {viewUser.role === ROLES.MASTER && (
                    <div>
                      <label className="form-label">Priority Level</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['A1', 'B1', 'C1'] as const).map(p => (
                          <button 
                            key={p}
                            type="button" 
                            onClick={() => setEditUserForm({ ...editUserForm, masterPriority: p })}
                            className={editUserForm.masterPriority === p ? 'btn-gradient' : 'btn-outline'}
                            style={{ flex: 1, padding: '0.5rem' }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewUser.role === ROLES.MASTER && editUserForm.masterPriority !== 'A1' && (
                    <div>
                      <label className="form-label">Linked Staff ID</label>
                      <input type="text" className="form-input" value={editUserForm.linkedStaffId || ''} onChange={e => setEditUserForm({ ...editUserForm, linkedStaffId: e.target.value })} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowDetails(true)}>
                    View Details
                  </button>
                  <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                    <button type="button" className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }} onClick={() => setShowDetails(false)}>
                      ← Back to Edit
                    </button>
                 </div>

                 {/* Role-Specific Details Section */}
                 {(viewUser.role === ROLES.ADMIN || viewUser.role === ROLES.MASTER) && (
                   <div style={{ display: 'grid', gap: '1.5rem' }}>
                     <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                       <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Action Logs</h4>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                         <div><span style={{ color: 'var(--text-muted)' }}>Last Login:</span> Today, 09:00 AM</div>
                         <div><span style={{ color: 'var(--text-muted)' }}>Last Logout:</span> Today, 05:30 PM</div>
                         <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Recent Actions:</span> Updated standard curriculum, verified 3 new staff entries.</div>
                       </div>
                     </div>

                     {viewUser.role === ROLES.MASTER && (
                       <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                         <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Lead Metrics</h4>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Generated</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>42</div>
                           </div>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Closed (Registered)</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#4ade80' }}>18</div>
                           </div>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pending Follow-up</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#facc15' }}>24</div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                 {(viewUser.role === ROLES.STAFF || viewUser.role === ROLES.STUDENT) && (
                   <div>
                     <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                       <button className={activeTab === 'profile' ? 'badge badge-purple' : 'badge badge-outline'} onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}>Basic Profile</button>
                       <button className={activeTab === 'attendance' ? 'badge badge-purple' : 'badge badge-outline'} onClick={() => setActiveTab('attendance')} style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}>Activity & Attendance</button>
                       <button className={activeTab === 'payment' ? 'badge badge-purple' : 'badge badge-outline'} onClick={() => setActiveTab('payment')} style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem' }}>{viewUser.role === ROLES.STAFF ? 'Salary details' : 'Fee details'}</button>
                     </div>

                     {activeTab === 'profile' && (
                       <form onSubmit={handleUpdateUserDetails} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', display: 'grid', gap: '1.25rem' }}>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                           <div>
                             <label className="form-label" style={{ fontSize: '0.8rem' }}>Profile Photo Initial / Avatar</label>
                             <input type="text" className="form-input" maxLength={2} value={editUserForm.avatar || ''} onChange={e => setEditUserForm({ ...editUserForm, avatar: e.target.value.toUpperCase() })} style={{ background: 'rgba(0,0,0,0.2)' }} />
                           </div>
                           {viewUser.role === ROLES.STUDENT && (
                             <div>
                               <label className="form-label" style={{ fontSize: '0.8rem' }}>Enrolled Course</label>
                               <div style={{ padding: '0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--accent)', fontWeight: 600 }}>
                                 {viewUser.course || 'Not specified'}
                               </div>
                             </div>
                           )}
                           {viewUser.role === ROLES.STUDENT && (
                             <div>
                               <label className="form-label" style={{ fontSize: '0.8rem' }}>Assigned Batch</label>
                               <div style={{ padding: '0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: '#4ade80', fontWeight: 600 }}>
                                 {viewUser.batchId || 'No Batch'}
                               </div>
                             </div>
                           )}
                         </div>
                         <div>
                           <label className="form-label" style={{ fontSize: '0.8rem' }}>Address</label>
                           <textarea className="form-input" rows={2} value={editUserForm.address || ''} onChange={e => setEditUserForm({ ...editUserForm, address: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)' }} />
                         </div>
                         <div>
                           <label className="form-label" style={{ fontSize: '0.8rem' }}>Qualifications</label>
                           <input type="text" className="form-input" value={editUserForm.qualifications || ''} onChange={e => setEditUserForm({ ...editUserForm, qualifications: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)' }} />
                         </div>
                         <div>
                           <label className="form-label" style={{ fontSize: '0.8rem' }}>Extra Skills</label>
                           <input type="text" className="form-input" value={editUserForm.extraSkills || ''} onChange={e => setEditUserForm({ ...editUserForm, extraSkills: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)' }} />
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                           <button type="submit" className="btn-gradient" disabled={loading} style={{ padding: '0.4rem 1.5rem', fontSize: '0.85rem' }}>
                             {loading ? 'Saving...' : 'Save Profile'}
                           </button>
                         </div>
                       </form>
                     )}

                     {activeTab === 'attendance' && (
                       <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', display: 'grid', gap: '1rem' }}>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                           <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Last Login</span><div>Today, 09:30 AM</div></div>
                           <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Last Logout</span><div>Today, 04:00 PM</div></div>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Attendance Rate</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{viewUser.attendance || 85}%</div>
                           </div>
                           <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Classes {viewUser.role === ROLES.STAFF ? 'Taken' : 'Attended'}</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{viewUser.classesAttended || 24}</div>
                           </div>
                         </div>
                         {viewUser.role === ROLES.STAFF && (
                           <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Instruction Time</span><div>{viewUser.classesTakenTime || '48 Hours'}</div></div>
                         )}
                         {viewUser.role === ROLES.STUDENT && (
                           <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Screen Time (App Usage)</span><div>{viewUser.screenTime || '14.5 Hours'}</div></div>
                         )}
                       </div>
                     )}

                     {activeTab === 'payment' && (
                       <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', display: 'grid', gap: '1rem' }}>
                         {viewUser.role === ROLES.STAFF ? (
                           <>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Current Salary</span><div style={{ fontSize: '1.2rem', fontWeight: 500 }}>₹{viewUser.salaryDetails?.current || '25,000'}</div></div>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Average Salary</span><div style={{ fontSize: '1.2rem', fontWeight: 500 }}>₹{viewUser.salaryDetails?.average || '23,500'}</div></div>
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Paid</span><div style={{ color: '#4ade80' }}>₹{viewUser.paymentDetails?.paid || '75,000'}</div></div>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending Balance</span><div style={{ color: '#facc15' }}>₹{viewUser.paymentDetails?.remaining || '0'}</div></div>
                             </div>
                           </>
                         ) : (
                           <>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Base Course Fee</span><div>₹{viewUser.paymentDetails?.feeOfCourse || '50,000'}</div></div>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Admission Fee</span><div>₹{viewUser.paymentDetails?.admissionFee || '5,000'}</div></div>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Facility Fee</span><div>₹{viewUser.paymentDetails?.facilityFee || '2,500'}</div></div>
                               <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Maintenance Fee</span><div>₹{viewUser.paymentDetails?.maintenanceFee || '1,000'}</div></div>
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Amount Paid</div>
                                 <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#4ade80' }}>₹{viewUser.paymentDetails?.paid || '20,000'}</div>
                               </div>
                               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Remaining Due</div>
                                 <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ff4d4d' }}>₹{viewUser.paymentDetails?.remaining || '38,500'}</div>
                               </div>
                             </div>
                           </>
                         )}
                       </div>
                     )}
                   </div>
                 )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
