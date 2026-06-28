'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { STAFF_NAV_ITEMS } from '@/lib/roles';
import { Course, User, Batch, Schedule } from '@/lib/store';
import { formatDateToUI } from '@/lib/utils';

export default function DailySchedulePage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string;
  const canModify = ['admin', 'master', 'staff'].includes(userRole);

  // Core Data Lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // State Management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Field States
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [pdfLink, setPdfLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Custom multi-select state
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load Initial Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, uRes, bRes, sRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/users'),
        fetch('/api/batches'),
        fetch('/api/schedules')
      ]);

      if (cRes.ok) setCourses(await cRes.ok ? await cRes.json() : []);
      if (uRes.ok) {
        const allUsers: User[] = await uRes.json();
        // Teachers are staff/admin/masters, exclude students
        setTeachers(allUsers.filter(u => u.role !== 'student'));
      }
      if (bRes.ok) setBatches(await bRes.json());
      if (sRes.ok) setSchedules(await sRes.json());
    } catch (error) {
      console.error('Failed to fetch schedule setup data:', error);
      showNotification('Failed to load initial data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBatchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Filter schedules to current date
  const dailySchedules = schedules.filter(s => s.date === selectedDate);

  // Toggle multi-select batch
  const handleBatchToggle = (batchId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId) 
        : [...prev, batchId]
    );
  };

  // Form validations
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!startTime) errors.push('Start time is required.');
    if (!endTime) errors.push('End time is required.');
    if (startTime && endTime && startTime >= endTime) {
      errors.push('End time must be after start time.');
    }
    if (!selectedSubjectId) errors.push('Please select a subject.');
    if (!selectedTeacherId) errors.push('Please assign a teacher.');
    if (selectedBatchIds.length === 0) {
      errors.push('Please select at least one batch.');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const executeSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    
    const subject = courses.find(c => c.id === selectedSubjectId);
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    const batchList = batches.filter(b => selectedBatchIds.includes(b.id));

    const payload = {
      date: selectedDate,
      startTime,
      endTime,
      subjectId: selectedSubjectId,
      subjectName: subject?.courseName || 'Unknown Subject',
      teacherId: selectedTeacherId,
      teacherName: teacher?.name || 'Unknown Teacher',
      batchIds: selectedBatchIds,
      batchNames: batchList.map(b => b.batchName),
      pdfLink,
      videoUrl
    };

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('Schedule saved successfully!', 'success');
        // Reset form
        setStartTime('');
        setEndTime('');
        setSelectedSubjectId('');
        setSelectedTeacherId('');
        setSelectedBatchIds([]);
        setPdfLink('');
        setVideoUrl('');
        setShowAddForm(false);
        // Refresh schedules
        const sRes = await fetch('/api/schedules');
        if (sRes.ok) setSchedules(await sRes.json());
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || 'Failed to save schedule.', 'error');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showNotification('An error occurred. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showNotification('Schedule deleted successfully!', 'success');
        const sRes = await fetch('/api/schedules');
        if (sRes.ok) setSchedules(await sRes.json());
      } else {
        showNotification('Failed to delete schedule.', 'error');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showNotification('An error occurred during deletion.', 'error');
    }
  };

  const getSubjectName = (id: string) => {
    return courses.find(c => c.id === id)?.courseName || 'Unknown';
  };

  const getTeacherName = (id: string) => {
    return teachers.find(t => t.id === id)?.name || 'Unknown';
  };

  return (
    <DashboardLayout title="Daily Schedule Management" navItems={STAFF_NAV_ITEMS}>
      {/* Dynamic Toast / Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1100,
          padding: '1rem 2rem',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          fontFamily: 'Outfit',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          border: notification.type === 'success' ? '1px solid #22c55e' : '1px solid #ef4444',
          transition: 'all 0.3s ease'
        }}>
          {notification.type === 'success' ? '✓ ' : '✗ '} {notification.message}
        </div>
      )}

      {/* Main Container */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Date Selector & Action Header Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <label className="form-label" style={{ marginBottom: '0.25rem' }}>Select Target Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={selectedDate} 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setShowAddForm(false); // Reset form display on date shift
                }} 
                style={{ 
                  maxWidth: '280px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white'
                }} 
              />
            </div>

            {canModify && !showAddForm && (
              <button 
                className="btn-gradient" 
                onClick={() => setShowAddForm(true)}
              >
                📅 Add New Program
              </button>
            )}
          </div>
        </div>

        {/* Add Program Form (Inline section to preserve context) */}
        {showAddForm && (
          <div className="glass-card animate-slide-up" style={{ padding: '2rem', border: '1px solid var(--primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Outfit', color: 'var(--primary-light)' }}>
                New Class Session Details for {formatDateToUI(selectedDate)}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setFormErrors([]);
                }} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveClick} style={{ display: 'grid', gap: '1.5rem' }}>
              {formErrors.length > 0 && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Please fix the following:</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Grid for core fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                
                {/* Time slot slots */}
                <div>
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    required 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)}
                    style={{ color: 'white' }}
                  />
                </div>

                <div>
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    required 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)}
                    style={{ color: 'white' }}
                  />
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="form-label">Subject Selection</label>
                  <select 
                    className="form-input" 
                    required 
                    value={selectedSubjectId} 
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    style={{ backgroundColor: '#0d0d2b', color: 'white' }}
                  >
                    <option value="">Select Subject...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.courseName}</option>
                    ))}
                  </select>
                </div>

                {/* Teacher dropdown */}
                <div>
                  <label className="form-label">Assign Teacher</label>
                  <select 
                    className="form-input" 
                    required 
                    value={selectedTeacherId} 
                    onChange={e => setSelectedTeacherId(e.target.value)}
                    style={{ backgroundColor: '#0d0d2b', color: 'white' }}
                  >
                    <option value="">Select Teacher...</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.role.replace(/^\w/, (c) => c.toUpperCase())})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                
                {/* Custom multi-select dropdown for Batches */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <label className="form-label">Batch Assignment</label>
                  <button 
                    type="button" 
                    className="form-input" 
                    onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                    style={{
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <span>
                      {selectedBatchIds.length === 0 
                        ? 'Select Batches...' 
                        : `${selectedBatchIds.length} batch(es) selected`}
                    </span>
                    <span>{showBatchDropdown ? '▲' : '▼'}</span>
                  </button>

                  {showBatchDropdown && (
                    <div className="glass-card" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      marginTop: '0.5rem',
                      padding: '1rem',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      backgroundColor: '#0d0d2b',
                      border: '1px solid var(--surface-border)',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {batches.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active batches found.</div>
                      ) : (
                        batches.map(batch => (
                          <label 
                            key={batch.id} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0',
                              cursor: 'pointer',
                              color: 'white',
                              fontSize: '0.9rem'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedBatchIds.includes(batch.id)} 
                              onChange={() => handleBatchToggle(batch.id)}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            {batch.batchName}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* PDF Link */}
                <div>
                  <label className="form-label">PDF Link (Topic Material)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://example.com/topic-material.pdf" 
                    value={pdfLink} 
                    onChange={e => setPdfLink(e.target.value)}
                    style={{ color: 'white' }}
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="form-label">Video URL (Pre-learning Content)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://example.com/pre-learning-video" 
                    value={videoUrl} 
                    onChange={e => setVideoUrl(e.target.value)}
                    style={{ color: 'white' }}
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setFormErrors([]);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gradient">
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing schedules list */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem' }}>
            Scheduled Sessions for {formatDateToUI(selectedDate)}
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading schedules...
            </div>
          ) : dailySchedules.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem', 
              color: 'var(--text-muted)',
              border: '2px dashed rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-lg)'
            }}>
              📅 No classes scheduled for this date.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {dailySchedules.map((schedule) => (
                <div 
                  key={schedule.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', flex: 1 }}>
                    {/* Time Slot Column */}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time Slot</div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-light)', fontFamily: 'Outfit' }}>
                        ⏰ {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>

                    {/* Subject Column */}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Subject</div>
                      <div style={{ fontWeight: 600, color: 'white' }}>{schedule.subjectName}</div>
                    </div>

                    {/* Teacher Column */}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Teacher</div>
                      <div style={{ color: 'white' }}>🧑‍🏫 {schedule.teacherName}</div>
                    </div>

                    {/* Batches Column */}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Batches</div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                        {schedule.batchNames.map((name, i) => (
                          <span key={i} className="badge badge-purple" style={{ textTransform: 'none', fontSize: '0.7rem' }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Resources Column */}
                    {(schedule.pdfLink || schedule.videoUrl) && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Resources</div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                          {schedule.pdfLink && (
                            <a 
                              href={schedule.pdfLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: 'var(--primary-light)', fontSize: '0.85rem', textDecoration: 'underline' }}
                            >
                              📄 PDF
                            </a>
                          )}
                          {schedule.videoUrl && (
                            <a 
                              href={schedule.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: 'var(--accent-light)', fontSize: '0.85rem', textDecoration: 'underline' }}
                            >
                              🎥 Video
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  {canModify && (
                    <div>
                      <button 
                        className="btn-outline" 
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          color: '#ff4d4d',
                          border: '1px solid rgba(255, 77, 77, 0.25)',
                          borderRadius: '20px',
                          fontSize: '0.8rem'
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
            <h3 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem', color: 'var(--primary-light)' }}>
              Confirm Class Schedule
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Please review and confirm the session details before saving:
            </p>

            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date: </span>
                <strong style={{ color: 'white' }}>{formatDateToUI(selectedDate)}</strong>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Time Slot: </span>
                <strong style={{ color: 'var(--accent-light)' }}>{startTime} - {endTime}</strong>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subject: </span>
                <strong style={{ color: 'white' }}>{getSubjectName(selectedSubjectId)}</strong>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Teacher: </span>
                <strong style={{ color: 'white' }}>{getTeacherName(selectedTeacherId)}</strong>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Batches: </span>
                <span style={{ color: 'white', fontWeight: 600 }}>
                  {batches.filter(b => selectedBatchIds.includes(b.id)).map(b => b.batchName).join(', ')}
                </span>
              </div>
              {(pdfLink || videoUrl) && (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Resources: </span>
                  <div style={{ marginTop: '0.25rem', paddingLeft: '1rem' }}>
                    {pdfLink && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>• PDF: {pdfLink}</div>}
                    {videoUrl && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>• Video: {videoUrl}</div>}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn-outline" 
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                Back to Edit
              </button>
              <button 
                className="btn-gradient" 
                onClick={executeSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
