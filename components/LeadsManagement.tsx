'use client';
import { useState, useEffect } from 'react';
import { Lead, LeadStatus, Program, Stream, Appointment, User, Course } from '@/lib/store';
import { formatDateToUI, parseUIDateTimeToISO } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function LeadsManagement() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string;
  const canModify = ['admin', 'master'].includes(userRole);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{ lead: Lead; targetStatus: LeadStatus } | null>(null);
  const [appointmentModal, setAppointmentModal] = useState<{ lead: Lead } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNo: '',
    programId: '',
    streamId: '',
    courseId: '',
    source: '',
    occupation: '' as 'student' | 'working' | 'non-working' | '',
  });

  const [appointmentForm, setAppointmentForm] = useState({
    dateTime: '',
    notes: '',
    previousRemarks: '',
  });
  
  const [appointmentError, setAppointmentError] = useState('');
  const [scheduleNext, setScheduleNext] = useState(false);

  const fetchData = async () => {
    try {
      const [lRes, pRes, sRes, uRes, cRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/programs'),
        fetch('/api/streams'),
        fetch('/api/users'),
        fetch('/api/courses')
      ]);
      if (lRes.ok) setLeads(await lRes.json());
      if (pRes.ok) setPrograms(await pRes.json());
      if (sRes.ok) setStreams(await sRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (cRes.ok) setCourses(await cRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers ---
  const isEmailUnique = (email: string, currentId?: string) => {
    const leadExists = leads.some(l => l.email.toLowerCase() === email.toLowerCase() && l.id !== currentId);
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    return !leadExists && !userExists;
  };

  const validateAppointmentDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    
    // Format: DD/MM/YYYY HH:MM
    const regex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
    const match = dateTime.match(regex);
    
    if (!match) return '👉 Invalid time format';
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);
    
    if (month < 1 || month > 12) return '👉 Invalid month';
    
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (day < 1 || day > daysInMonth[month - 1]) return '👉 Invalid date';
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '👉 Invalid time format';
    
    return '';
  };

  // --- Add & Edit Handlers ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isEmailUnique(formData.email)) {
        setNotification({ title: 'Duplicate Email ID', message: 'This email is already in use by another lead, student, or staff member.', type: 'error' });
        setLoading(false);
        return;
      }
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchData();
        setShowAddModal(false);
        resetFormData();
      }
    } catch (error) {
      console.error('Failed to save lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!viewLead) return;
      if (!isEmailUnique(formData.email, viewLead.id)) {
        setNotification({ title: 'Duplicate Email ID', message: 'This email is already in use by another lead, student, or staff member.', type: 'error' });
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/leads/${viewLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updatedLead = await res.json();
        await fetchData();
        setViewLead(updatedLead); // Update modal details instantly
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({ name: '', email: '', contactNo: '', programId: '', streamId: '', courseId: '', source: '', occupation: '' });
  };

  const openEditMode = () => {
    if (viewLead) {
      setFormData({
        name: viewLead.name,
        email: viewLead.email,
        contactNo: viewLead.contactNo,
        programId: viewLead.programId || '',
        streamId: viewLead.streamId || '',
        courseId: viewLead.courseId || '',
        source: viewLead.source || '',
        occupation: viewLead.occupation || '',
      });
      setIsEditing(true);
    }
  };

  // --- Status Change Handlers ---
  const confirmStatusChange = async () => {
    if (!statusConfirm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${statusConfirm.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusConfirm.targetStatus }),
      });
      if (res.ok) {
        await fetchData();
        setStatusConfirm(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Appointment Handlers ---
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentModal) return;

    if (scheduleNext) {
      const error = validateAppointmentDateTime(appointmentForm.dateTime);
      if (error) {
        setAppointmentError(error);
        return;
      }
    }

    setLoading(true);
    try {
      // Send the payload exactly as the API expects it
      const payload = {
        type: 'appointment',
        dateTime: scheduleNext ? parseUIDateTimeToISO(appointmentForm.dateTime) : undefined,
        notes: appointmentForm.notes,
        previousRemarks: appointmentForm.previousRemarks
      };

      const res = await fetch(`/api/leads/${appointmentModal.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchData();
        closeAppointmentModal();
      }
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAppointmentModal = (lead: Lead) => {
    setAppointmentModal({ lead });
    
    // Get appointments in history
    const history = lead.appointmentHistory || [];
    
    // Determine which appointment is the "Next" one
    const nextApptIndex = lead.nextAppointment 
      ? history.findIndex(a => a.appointmentDateTime === lead.nextAppointment)
      : -1;
    
    // Previous remarks come from the most recent appointment that is NOT the "Next" one
    // If no next appointment is set, it's just the last one in history.
    let lastPastAppt = null;
    if (nextApptIndex === -1) {
      lastPastAppt = history.length > 0 ? history[history.length - 1] : null;
    } else {
      // Find the last one that isn't the next one (usually the one before it)
      lastPastAppt = history.length > 1 ? history.filter((_, i) => i !== nextApptIndex).pop() : null;
    }
    
    const existingRemarks = lastPastAppt?.notes || '';
    
    // If there's a nextAppointment already scheduled, pre-populate its date and notes
    let nextDate = '';
    let nextNotes = '';
    
    if (nextApptIndex !== -1) {
      const nextAppt = history[nextApptIndex];
      // Convert ISO to UI format DD/MM/YYYY HH:MM
      const date = new Date(nextAppt.appointmentDateTime);
      if (!isNaN(date.getTime())) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        nextDate = `${d}/${m}/${y} ${hh}:${mm}`;
        nextNotes = nextAppt.notes || '';
      }
    }

    setAppointmentForm({ 
      dateTime: nextDate, 
      notes: nextNotes, 
      previousRemarks: existingRemarks 
    });
    setScheduleNext(!!lead.nextAppointment || history.length === 0);
  };

  const closeAppointmentModal = () => {
    setAppointmentModal(null);
    setAppointmentForm({ dateTime: '', notes: '', previousRemarks: '' });
    setScheduleNext(false);
  };

  // --- Delete Handlers ---
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        setDeleteConfirm(null);
        setViewLead(null);
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const sources = [
    "some one who studied in Xbe Academy",
    "some one who do not studied in Xbe Academy",
    "Instragram",
    "Whatsapp",
    "Facebook",
    "Direct coming and take admission, agent can mension it as your own way",
    "other"
  ];

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'Outfit' }}>Leads & Inquiry Module</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="form-input" 
              style={{ paddingLeft: '2.5rem', width: '250px', marginBottom: 0 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="form-input" 
            style={{ width: '180px', marginBottom: 0, backgroundColor: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Connected">Connected</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Registered">Registered</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>
          {canModify && (
            <button className="btn-gradient" onClick={() => { resetFormData(); setShowAddModal(true); }}>
              + Add New Lead
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Lead Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Contact Details</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Program / Stream</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Next Appointment</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads
                .filter(l => {
                  const matchesSearch = 
                    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    programs.find(p => p.id === l.programId)?.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    streams.find(s => s.id === l.streamId)?.streamName.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{lead.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {lead.id}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{lead.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.contactNo}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="badge badge-blue" style={{ marginBottom: '0.25rem' }}>
                      {programs.find(p => p.id === lead.programId)?.programName || 'Unknown Program'}
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      {streams.find(s => s.id === lead.streamId)?.streamName || 'Unknown Stream'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {lead.nextAppointment ? (
                      <div onClick={() => openAppointmentModal(lead)} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
                        📅 {formatDateToUI(lead.nextAppointment)}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>History: {lead.appointmentHistory?.length || 0}</div>
                      </div>
                    ) : (
                      <button className="btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} onClick={() => openAppointmentModal(lead)}>Schedule</button>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {lead.status === 'Registered' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-cyan">Registered</span>
                        {users.some(u => u.email === lead.email && u.role === 'student') ? 
                          <span title="Verified in Student List" style={{ cursor: 'help' }}>✅</span> : 
                          <span title="Missing in Student List" style={{ cursor: 'help' }}>❌</span>
                        }
                      </div>
                    ) : canModify ? (
                      <select 
                        value={statusConfirm?.lead.id === lead.id ? statusConfirm.targetStatus : lead.status} 
                        onChange={(e) => setStatusConfirm({ lead, targetStatus: e.target.value as LeadStatus })}
                        style={{ backgroundColor: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.35rem', cursor: 'pointer' }}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Connected">Connected</option>
                        <option value="Interested">Interested</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Registered" disabled>Registered (Automatic)</option>
                        <option value="Follow-up Required">Follow-up Required</option>
                      </select>
                    ) : (
                      <span className="badge badge-blue">{lead.status}</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                     <button className="btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => { setViewLead(lead); setIsEditing(false); }}>
                       {canModify ? 'Edit / View' : 'View Details'}
                     </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inquiries recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Lead Modal */}
      {viewLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
               <h2 style={{ fontFamily: 'Outfit' }}>{isEditing ? 'Edit Lead Details' : 'Lead Details'}</h2>
               {!isEditing && (
                 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                   {viewLead.status !== 'Registered' && canModify && (
                     <button className="btn-gradient" style={{ padding: '0.4rem 0.8rem' }} onClick={() => router.push(`/admin/registration?leadId=${viewLead.id}`)}>Register</button>
                   )}
                   {canModify && (
                     <>
                       <button className="btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={openEditMode}>Edit</button>
                       <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.3)' }} onClick={() => setDeleteConfirm(viewLead)}>Delete</button>
                     </>
                   )}
                   <button className="btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setViewLead(null)}>Close</button>
                 </div>
               )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Student Name</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Email ID</label>
                    <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Contact No</label>
                    <input type="tel" className="form-input" required value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Program</label>
                    <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.programId} onChange={e => setFormData({...formData, programId: e.target.value, streamId: '', courseId: ''})}>
                      <option value="">Select Program</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.programName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Looking for(Stream)</label>
                    <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.streamId} onChange={e => setFormData({...formData, streamId: e.target.value, courseId: ''})}>
                      <option value="">Select Stream</option>
                      {streams.filter(s => s.programId === formData.programId).map(s => <option key={s.id} value={s.id}>{s.streamName}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Course</label>
                  <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})}>
                    <option value="">Select Course...</option>
                    {courses.filter(c => c.streamId === formData.streamId).map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">How did they hear about Xbe Academy? (Source)</label>
                  <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                    <option value="">Select Source...</option>
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel Edit</button>
                  <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading}>{loading ? 'Saving...' : 'Confirm Update'}</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Name</span><div style={{ fontWeight: 500 }}>{viewLead.name}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Contact</span><div style={{ fontWeight: 500 }}>{viewLead.contactNo}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Email</span><div style={{ fontWeight: 500 }}>{viewLead.email}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Status</span><div><span className="badge badge-outline">{viewLead.status}</span></div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Program</span><div style={{ fontWeight: 500 }}>{programs.find(p => p.id === viewLead.programId)?.programName || 'N/A'}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stream</span><div style={{ fontWeight: 500 }}>{streams.find(s => s.id === viewLead.streamId)?.streamName || 'N/A'}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Source</span><div style={{ fontWeight: 500 }}>{viewLead.source || 'N/A'}</div></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Generated On</span><div style={{ fontWeight: 500 }}>{formatDateToUI(viewLead.createdAt)}</div></div>
                </div>
                <div>
                   <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Appointment History</h3>
                   {viewLead.appointmentHistory?.length > 0 ? (
                     <div style={{ display: 'grid', gap: '1rem' }}>
                       {viewLead.appointmentHistory.map((appt, i) => (
                         <div key={appt.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderLeft: `3px solid var(--accent)`, borderRadius: '4px' }}>
                           <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Appt #{i + 1} • Scheduled for {formatDateToUI(appt.appointmentDateTime)} {new Date(appt.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                           <div style={{ fontSize: '0.95rem' }}>{appt.notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No remarks recorded.</span>}</div>
                         </div>
                       ))}
                     </div>
                   ) : (<p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No history found.</p>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem' }}>Add New Inquiry</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
               <div>
                <label className="form-label">Student Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Email ID</label>
                  <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Contact No</label>
                  <input type="tel" className="form-input" required value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Program</label>
                  <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.programId} onChange={e => setFormData({...formData, programId: e.target.value, streamId: '', courseId: ''})}>
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.programName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Looking for(Stream)</label>
                  <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.streamId} onChange={e => setFormData({...formData, streamId: e.target.value, courseId: ''})}>
                    <option value="">Select Stream</option>
                    {streams.filter(s => s.programId === formData.programId).map(s => <option key={s.id} value={s.id}>{s.streamName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Course</label>
                <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})}>
                  <option value="">Select Course...</option>
                  {courses.filter(c => c.streamId === formData.streamId).map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">How did they hear about Xbe Academy? (Source)</label>
                <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                  <option value="">Select Source...</option>
                  {sources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Current Occupation</label>
                <select className="form-input" style={{ backgroundColor: '#111', color: 'white' }} required value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value as any})}>
                  <option value="">Select Occupation...</option>
                  <option value="student">Student</option>
                  <option value="working">Working Person</option>
                  <option value="non-working">Non Working Person</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading}>{loading ? 'Adding...' : 'Save Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {statusConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Confirm Status Change</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Are you sure you want to change the status of <strong>{statusConfirm.lead.name}</strong> to <strong>{statusConfirm.targetStatus}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStatusConfirm(null)}>Cancel</button>
              <button className="btn-gradient" style={{ flex: 1 }} onClick={confirmStatusChange} disabled={loading}>{loading ? 'Updating...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Scheduling Modal */}
      {appointmentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem' }}>Schedule Appointment</h2>
            <form onSubmit={handleAddAppointment} style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Previous Remarks (Update if needed)</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="Review or update notes from the previous appointment..."
                  value={appointmentForm.previousRemarks} 
                  onChange={e => setAppointmentForm({...appointmentForm, previousRemarks: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                 <input 
                   type="checkbox" 
                   id="scheduleNext" 
                   checked={scheduleNext} 
                   onChange={e => setScheduleNext(e.target.checked)} 
                   style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                 />
                 <label htmlFor="scheduleNext" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>Schedule Next Appointment?</label>
              </div>

              {scheduleNext && (
                <>
                  <div>
                    <label className="form-label">Next Appointment Date & Time</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="DD/MM/YYYY HH:MM"
                      required={scheduleNext} 
                      value={appointmentForm.dateTime} 
                      onChange={e => {
                        let val = e.target.value;
                        // Strip all non-digits
                        let digits = val.replace(/\D/g, '');
                        let formatted = '';
                        if (digits.length > 0) {
                          formatted += digits.substring(0, 2);
                          if (digits.length > 2) {
                            formatted += '/' + digits.substring(2, 4);
                            if (digits.length > 4) {
                              formatted += '/' + digits.substring(4, 8);
                              if (digits.length > 8) {
                                formatted += ' ' + digits.substring(8, 10);
                                if (digits.length > 10) {
                                  formatted += ':' + digits.substring(10, 12);
                                }
                              }
                            }
                          }
                        }
                        setAppointmentForm({...appointmentForm, dateTime: formatted});
                        // Clear error while typing if it's potentially correct
                        if (formatted.length === 16) {
                          setAppointmentError(validateAppointmentDateTime(formatted));
                        } else {
                          setAppointmentError('');
                        }
                      }} 
                    />
                    {appointmentError && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600 }}>{appointmentError}</p>}
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Format: DD/MM/YYYY HH:MM (24-hour)</small>
                  </div>
                  <div>
                    <label className="form-label">Next Appointment Remarks</label>
                    <textarea 
                      className="form-input" 
                      rows={2} 
                      placeholder="What should be discussed next?"
                      value={appointmentForm.notes} 
                      onChange={e => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={closeAppointmentModal}>Cancel</button>
                <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading}>{loading ? 'Saving...' : 'Save Remarks'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '1rem' }}>Permanently Delete?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Are you sure you want to delete the record for <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-gradient" style={{ flex: 1, background: 'linear-gradient(135deg, #ff4d4d 0%, #f43f5e 100%)' }} onClick={confirmDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete Permanently'}</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Modal */}
      {notification && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '380px', padding: '2rem', textAlign: 'center', border: `1px solid ${notification.type === 'success' ? 'var(--success)' : notification.type === 'error' ? '#ff4d4d' : 'var(--purple)'}33` }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: notification.type === 'success' ? 'var(--success)' : notification.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'var(--purple)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              boxShadow: `0 0 20px ${notification.type === 'success' ? 'var(--success)' : notification.type === 'error' ? 'rgba(255, 77, 77, 0.2)' : 'var(--purple)'}44`
            }}>
              {notification.type === 'error' ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : notification.type === 'success' ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              )}
            </div>
            <h3 style={{ fontFamily: 'Outfit', marginBottom: '0.75rem', fontSize: '1.25rem' }}>{notification.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>{notification.message}</p>
            <button className={`${notification.type === 'error' ? 'btn-outline' : 'btn-gradient'}`} style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', ...(notification.type === 'error' ? { color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.3)' } : {}) }} onClick={() => setNotification(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
