'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';
import { User } from '@/lib/store';
import { formatDateToUI, parseUIDateToISO, validateDOB } from '@/lib/utils';

import { useSession } from 'next-auth/react';

export default function StaffsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const canModify = userRole === 'admin' || userRole === 'master';

  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    experience: 'No experience',
    lastCompany: '',
    qualifications: '',
    role: 'Office Staff',
    exactDuty: '',
    // Step 3: Payment
    workType: '',
    salary: '',
    // Step 4: Basic
    fatherName: '',
    address: '',
    photo: '',
    bloodGroup: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const uRes = await fetch('/api/users');
        if (uRes.ok) {
          const allUsers: User[] = await uRes.json();
          // Filter for staff, manager, or master roles (exclude students and primary admin if desired, but here we show all non-students)
          setStaff(allUsers.filter(u => u.role !== 'student' && u.email !== 'admin@xbe.academy'));
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dob: parseUIDateToISO(formData.dob),
          salary: Number(formData.salary)
        })
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ 
          name: '', email: '', phone: '', dob: '', gender: '', experience: 'No experience', 
          lastCompany: '', qualifications: '', role: 'Office Staff', exactDuty: '',
          workType: '', salary: '', fatherName: '', address: '', photo: '', bloodGroup: ''
        });
        setCurrentStep(1);
        setErrors({});
        // Refresh list
        const uRes = await fetch('/api/users');
        if (uRes.ok) {
          const allUsers: User[] = await uRes.json();
          setStaff(allUsers.filter(u => u.role !== 'student' && u.email !== 'admin@xbe.academy'));
        }
      }
    } catch (error) {
      console.error('Failed to create staff:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Staffs Management" navItems={ADMIN_NAV_ITEMS}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Outfit' }}>Staff Registry</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="badge badge-purple">Total: {staff.length}</div>
            {canModify && (
              <button className="btn-gradient" onClick={() => setShowModal(true)}>+ Add Staff</button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Staff Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Joined On</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{member.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-blue">{member.role.toUpperCase()}</span>
                    {(member as any).masterPriority && (
                      <span className="badge badge-cyan" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>MASTER</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{member.email}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDateToUI(member.assignedAt)}</td>
                </tr>
              ))}
              {staff.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No staff members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-scale-up" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem' }}>Add New Staff - Step {currentStep} of 4</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {currentStep === 1 && (
              <div className="animate-fade">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Basic Details</h4>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Full Name</label>
                    <input type="text" className={`form-input ${errors.name ? 'error-ring' : ''}`} placeholder="Enter name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    {errors.name && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name}</div>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ color: 'white' }}>Email ID</label>
                      <input type="email" className={`form-input ${errors.email ? 'error-ring' : ''}`} placeholder="staff@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      {errors.email && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</div>}
                    </div>
                    <div>
                      <label className="form-label" style={{ color: 'white' }}>Phone Number</label>
                      <input type="text" className="form-input" placeholder="9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ color: 'white' }}>Date of Birth</label>
                      <input 
                      type="text" 
                      className={`form-input ${errors.dob ? 'error-ring' : ''}`} 
                      placeholder="DD-MM-YYYY"
                      style={{ color: 'white' }} 
                      value={formData.dob} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val.length === 2 && !val.includes('-')) val += '-';
                        if (val.length === 5 && val.split('-').length === 2) val += '-';
                        if (val.length > 10) val = val.substring(0, 10);
                        setFormData({...formData, dob: val});
                      }} 
                    />
                    {errors.dob ? (
                      <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.dob}</div>
                    ) : (
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Format: DD-MM-YYYY</small>
                    )}
                    </div>
                    <div>
                      <label className="form-label" style={{ color: 'white' }}>Gender</label>
                      <select className={`form-input ${errors.gender ? 'error-ring' : ''}`} style={{ backgroundColor: '#111', color: '#fff' }} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="">Select Gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.gender}</div>}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Role</label>
                    <select className="form-input" style={{ backgroundColor: '#111', color: '#fff' }} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                      <option value="Office Staff">Office Staff</option>
                      <option value="Accounting Staff">Accounting Staff</option>
                      <option value="Teaching Staff">Teaching Staff</option>
                      <option value="Program Coordinators">Program Coordinators</option>
                      <option value="Outstaff">Outstaff</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Exact Duty (e.g. Physics Teacher, UI Designer)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Graphic, Web (use comma for multiple)" 
                      value={formData.exactDuty} 
                      onChange={e => setFormData({...formData, exactDuty: e.target.value})} 
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>If multiple duties, separate by commas (",")</small>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-fade">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Professional Details</h4>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Years of Experience</label>
                    <select className="form-input" style={{ backgroundColor: '#111', color: '#fff' }} value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value, lastCompany: e.target.value === 'No experience' ? '' : formData.lastCompany})}>
                      <option value="No experience">No experience</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="2–4 years">2–4 years</option>
                      <option value="More than 5 years">More than 5 years</option>
                    </select>
                  </div>
                  {formData.experience !== 'No experience' && (
                    <div className="animate-slide-up">
                      <label className="form-label" style={{ color: 'white' }}>Last Company Worked</label>
                      <input type="text" className="form-input" placeholder="Company name" value={formData.lastCompany} onChange={e => setFormData({...formData, lastCompany: e.target.value})} />
                    </div>
                  )}
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Qualifications</label>
                    <textarea className={`form-input ${errors.qualifications ? 'error-ring' : ''}`} rows={3} placeholder="e.g. B.Tech in CS, MBA" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} />
                    {errors.qualifications && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.qualifications}</div>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-fade">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Payment Details</h4>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Work Type</label>
                    <select className={`form-input ${errors.workType ? 'error-ring' : ''}`} style={{ backgroundColor: '#111', color: '#fff' }} value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})}>
                      <option value="">Select Work Type...</option>
                      <option value="Hour-based">Hour-based</option>
                      <option value="Class-based">Class-based</option>
                      <option value="Daily Wage">Daily Wage</option>
                      <option value="Monthly Wage">Monthly Wage</option>
                    </select>
                    {errors.workType && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.workType}</div>}
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>
                      {formData.workType === 'Hour-based' ? 'Salary per Hour' : 
                       formData.workType === 'Class-based' ? 'Salary per Class' : 
                       formData.workType === 'Daily Wage' ? 'Daily Salary' : 
                       formData.workType === 'Monthly Wage' ? 'Monthly Salary' : 'Salary'}
                    </label>
                    <input 
                      type="number" 
                      className={`form-input ${errors.salary ? 'error-ring' : ''}`} 
                      placeholder={formData.workType ? `Enter ${formData.workType.toLowerCase()} salary` : 'Select work type first'} 
                      disabled={!formData.workType}
                      value={formData.salary} 
                      onChange={e => setFormData({...formData, salary: e.target.value})} 
                    />
                    {errors.salary && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.salary}</div>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="animate-fade">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Basic Details</h4>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Father's Name</label>
                    <input type="text" className={`form-input ${errors.fatherName ? 'error-ring' : ''}`} placeholder="Enter father's name" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                    {errors.fatherName && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.fatherName}</div>}
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Address</label>
                    <textarea className={`form-input ${errors.address ? 'error-ring' : ''}`} rows={3} placeholder="Enter full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    {errors.address && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.address}</div>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ color: 'white' }}>Staff Photo</label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/jpeg,image/png"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('File size must be less than 2MB');
                              e.target.value = '';
                              return;
                            }
                            setFormData({...formData, photo: URL.createObjectURL(file)});
                          }
                        }} 
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>JPG/PNG, Max: 2MB</div>
                    </div>
                    <div>
                      {formData.photo && (
                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                          <img src={formData.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'white' }}>Blood Group</label>
                    <select className={`form-input ${errors.bloodGroup ? 'error-ring' : ''}`} style={{ backgroundColor: '#111', color: '#fff' }} value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                      <option value="">Select Blood Group...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                    {errors.bloodGroup && <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.bloodGroup}</div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
              <button 
                className="btn-outline" 
                onClick={() => {
                  if (currentStep === 1) setShowModal(false);
                  else setCurrentStep(prev => prev - 1);
                }}
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              <button 
                className="btn-gradient" 
                onClick={() => {
                  const currentErrors: Record<string, string> = {};
                  
                  if (currentStep === 1) {
                    if (!formData.name) currentErrors.name = 'Full Name is required';
                    if (!formData.email) currentErrors.email = 'Email is required';
                    if (!formData.dob) currentErrors.dob = 'Date of birth is required';
                    else {
                      const dobVal = validateDOB(formData.dob);
                      if (!dobVal.isValid) currentErrors.dob = dobVal.error || 'Invalid date';
                    }
                    if (!formData.gender) currentErrors.gender = 'Gender is required';
                    
                    if (Object.keys(currentErrors).length > 0) {
                      setErrors(currentErrors);
                      return;
                    }
                    setErrors({});
                    setCurrentStep(2);
                  } else if (currentStep === 2) {
                    if (!formData.qualifications) currentErrors.qualifications = 'Qualifications are required';
                    
                    if (Object.keys(currentErrors).length > 0) {
                      setErrors(currentErrors);
                      return;
                    }
                    setErrors({});
                    setCurrentStep(3);
                  } else if (currentStep === 3) {
                    if (!formData.workType) currentErrors.workType = 'Work type is required';
                    if (!formData.salary) currentErrors.salary = 'Salary is required';
                    else if (Number(formData.salary) <= 0) currentErrors.salary = 'Salary must be a positive number';
                    
                    if (Object.keys(currentErrors).length > 0) {
                      setErrors(currentErrors);
                      return;
                    }
                    setErrors({});
                    setCurrentStep(4);
                  } else {
                    if (!formData.fatherName) currentErrors.fatherName = "Father's Name is required";
                    if (formData.fatherName && /^\d+$/.test(formData.fatherName)) currentErrors.fatherName = "Father's Name cannot be numeric-only";
                    if (!formData.address) currentErrors.address = 'Address is required';
                    if (!formData.bloodGroup) currentErrors.bloodGroup = 'Blood Group is required';
                    
                    if (Object.keys(currentErrors).length > 0) {
                      setErrors(currentErrors);
                      return;
                    }
                    setErrors({});
                    handleSubmit();
                  }
                }}
                disabled={loading}
              >
                {currentStep === 4 ? (loading ? 'Saving...' : 'Finish Registration') : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
