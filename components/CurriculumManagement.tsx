'use client';
import { useState, useEffect } from 'react';
import { Program, Stream, Course, Batch, ProgramStatus } from '@/lib/store';
import { useSession } from 'next-auth/react';
import { isValidDate, formatToDisplayDate, isBeforeOrEqual, formatDDMMYYYY, validateBatchDate } from '@/lib/dateUtils';

export default function CurriculumManagement() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string;
  const canModify = ['admin', 'master'].includes(userRole);

  const [activeTab, setActiveTab] = useState<'programs' | 'streams' | 'courses' | 'batches' | 'job_titles'>('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<{ type: 'program' | 'stream' | 'course' | 'batch' | 'job-title'; data?: any } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [itemName, setItemName] = useState('');
  const [launchedAt, setLaunchedAt] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [fee, setFee] = useState('');
  const [status, setStatus] = useState<ProgramStatus>('Open');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState<{start?: string; end?: string}>({});
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | 'All'>('Open');
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'info' } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchData = async () => {
    try {
      const [pRes, sRes, cRes, bRes, jRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/streams'),
        fetch('/api/courses'),
        fetch('/api/batches'),
        fetch('/api/job-titles')
      ]);
      if (pRes.ok) setPrograms(await pRes.json());
      if (sRes.ok) setStreams(await sRes.json());
      if (cRes.ok) setCourses(await cRes.json());
      if (jRes.ok) setJobTitles(await jRes.json());
      if (bRes.ok) {
        const fetchedBatches: Batch[] = await bRes.json();
        setBatches(fetchedBatches);
        
        // Batch Completion Alert
        const today = formatDDMMYYYY(new Date());
        const completedBatches = fetchedBatches.filter(b => b.endDate === today && (b.status || 'Open') === 'Open');
        if (completedBatches.length > 0) {
          const names = completedBatches.map(b => b.batchName).join(', ');
          setNotification({
            title: 'Batch End Date Reached',
            message: `Batch end date has been reached for: ${names}. Please update the status to Closed.`,
            type: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showModal) return;
    
    // Validation
    const newErrors: string[] = [];
    if (!itemName.trim()) newErrors.push('Name is required');
    
    if (showModal.type === 'batch') {
      const startRes = validateBatchDate(startDate);
      const endRes = validateBatchDate(endDate);
      
      if (!startRes.isValid) {
        newErrors.push(`Start Date: ${startRes.error}`);
        setDateErrors(prev => ({...prev, start: startRes.error}));
      }
      if (!endRes.isValid) {
        newErrors.push(`End Date: ${endRes.error}`);
        setDateErrors(prev => ({...prev, end: endRes.error}));
      }
      if (startRes.isValid && endRes.isValid && !isBeforeOrEqual(startDate, endDate)) {
        newErrors.push('End Date must be after or equal to Start Date');
        setDateErrors(prev => ({...prev, end: 'Must be after Start Date'}));
      }
    } else {
      if (!isValidDate(launchedAt)) newErrors.push('Invalid Launched On format (DD/MM/YYYY)');
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const executeSave = async () => {
      setLoading(true);
      let payload: any = { status };
      const type = showModal.type;

      if (type === 'program') {
        payload = { ...payload, programName: itemName, launchedAt };
      } else if (type === 'stream') {
        payload = { ...payload, streamName: itemName, programId: selectedProgramId, launchedAt };
      } else if (type === 'course') {
        payload = { ...payload, courseName: itemName, programId: selectedProgramId, streamId: selectedStreamId, courseFee: Number(fee), launchedAt, createdBy: (session?.user as any)?.id || '1' };
      } else if (type === 'batch') {
        payload = { ...payload, batchName: itemName, streamId: selectedStreamId, courseId: selectedCourseId, launchedAt: startDate, startDate, endDate };
      } else if (type === 'job-title') {
        payload = { titleName: itemName };
      }

      try {
        const getEndpoint = (t: string) => t === 'batch' ? '/api/batches' : t === 'job-title' ? '/api/job-titles' : `/api/${t}s`;
        const endpoint = getEndpoint(type);
        const method = showModal.data ? 'PATCH' : 'POST';
        const url = showModal.data ? `${endpoint}/${showModal.data.id}` : endpoint;

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const oldStatus = showModal.data?.status || 'Open';
          if (status === 'Closed' && oldStatus !== 'Closed') {
            setNotification({
              title: 'Batch Successfully Closed',
              message: `The status of ${itemName} has been updated to Closed.`,
              type: 'success'
            });
          }
          await fetchData();
          setShowModal(null);
        }
      } catch (error) {
        console.error(`Failed to save ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    if (showModal.data) {
      setPendingAction({
        title: `Confirm Edit`,
        message: `Are you sure you want to save the changes to this ${showModal.type}?`,
        onConfirm: executeSave
      });
    } else {
      executeSave();
    }
  };

  const handleDelete = async (id: string, type: string) => {
    setPendingAction({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const getEndpoint = (t: string) => t === 'batch' ? '/api/batches' : t === 'job-title' ? '/api/job-titles' : `/api/${t}s`;
          const endpoint = getEndpoint(type);
          const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
          if (res.ok) await fetchData();
        } catch (error) {
          console.error(`Failed to delete ${type}:`, error);
        }
      }
    });
  };

  const openAddModal = (tab: typeof activeTab) => {
    const typeMap: Record<string, 'program' | 'stream' | 'course' | 'batch' | 'job-title'> = {
      programs: 'program',
      streams: 'stream',
      courses: 'course',
      batches: 'batch',
      job_titles: 'job-title'
    };
    setItemName('');
    setLaunchedAt(formatDDMMYYYY(new Date()));
    setSelectedCourseId('');
    setFee('');
    setStatus('Open');
    setStartDate('');
    setEndDate('');
    setErrors([]);
    setDateErrors({});
    setShowModal({ type: typeMap[tab] });
  };

  const openEditModal = (item: any, tab: typeof activeTab) => {
    const typeMap: Record<string, 'program' | 'stream' | 'course' | 'batch' | 'job-title'> = {
      programs: 'program',
      streams: 'stream',
      courses: 'course',
      batches: 'batch',
      job_titles: 'job-title'
    };
    const type = typeMap[tab];
    setItemName(item.programName || item.streamName || item.courseName || item.batchName || item.titleName);
    setLaunchedAt(formatToDisplayDate(item.launchedAt));
    setSelectedStreamId(item.streamId || '');
    setSelectedCourseId(item.courseId || '');
    setFee(item.courseFee?.toString() || '');
    setStatus(item.status || 'Open');
    
    if (type === 'batch') {
      const stream = streams.find(s => s.id === item.streamId);
      setSelectedProgramId(stream?.programId || '');
    } else {
      setSelectedProgramId(item.programId || '');
    }

    setStartDate(item.startDate || '');
    setEndDate(item.endDate || '');
    setErrors([]);
    setDateErrors({});
    setShowModal({ type, data: item });
  };

  const getStatusBadge = (status: ProgramStatus) => {
    const colors: Record<ProgramStatus, string> = {
      'Open': 'var(--success)',
      'Closed': 'var(--text-muted)',
      'Postponed': 'var(--warning)'
    };
    return (
      <span style={{ 
        padding: '0.2rem 0.5rem', 
        borderRadius: '4px', 
        fontSize: '0.75rem', 
        backgroundColor: `${colors[status]}22`, 
        color: colors[status],
        border: `1px solid ${colors[status]}44`
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['programs', 'streams', 'courses', 'batches', 'job_titles'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'badge badge-purple' : 'badge badge-outline'}
              style={{ cursor: 'pointer', border: 'none', padding: '0.5rem 1rem', textTransform: 'capitalize' }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        {canModify && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {activeTab !== 'job_titles' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter Status:</span>
                <select 
                  className="form-input" 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value as any)}
                  style={{ backgroundColor: '#111', color: 'white', padding: '0.4rem 0.8rem', minWidth: '120px' }}
                >
                  <option value="All">All</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Postponed">Postponed</option>
                </select>
              </div>
            )}
            <button className="btn-gradient" onClick={() => openAddModal(activeTab)}>
              + Add New {activeTab === 'batches' ? 'Batch' : activeTab === 'job_titles' ? 'Job Title' : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
            </button>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem', textTransform: 'capitalize' }}>
          {activeTab.replace('_', ' ')} Management
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name</th>
                {activeTab === 'streams' && <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Program</th>}
                {activeTab === 'courses' && <>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Program</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Stream</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Fee</th>
                </>}
                {activeTab === 'batches' && <>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Stream</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Course</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Start Date</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>End Date</th>
                </>}
                {activeTab !== 'batches' && activeTab !== 'job_titles' && <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Launched On</th>}
                {activeTab === 'job_titles' && <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Created At</th>}
                {activeTab !== 'job_titles' && <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>}
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'programs' && [...programs].filter(p => statusFilter === 'All' || (p.status || 'Open') === statusFilter).reverse().map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>{p.programName}</td>
                  <td style={{ padding: '1rem' }}>{formatToDisplayDate(p.launchedAt)}</td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(p.status || 'Open')}</td>
                  <td style={{ padding: '1rem' }}>
                    {canModify ? (
                      <>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', marginRight: '0.5rem' }} onClick={() => openEditModal(p, 'programs')}>Edit</button>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', color: '#ff4d4d' }} onClick={() => handleDelete(p.id, 'program')}>Delete</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View Only</span>
                    )}
                  </td>
                </tr>
              ))}
              {activeTab === 'streams' && [...streams].filter(s => statusFilter === 'All' || (s.status || 'Open') === statusFilter).reverse().map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>{s.streamName}</td>
                  <td style={{ padding: '1rem' }}>{programs.find(p => p.id === s.programId)?.programName || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>{formatToDisplayDate(s.launchedAt)}</td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(s.status || 'Open')}</td>
                  <td style={{ padding: '1rem' }}>
                    {canModify ? (
                      <>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', marginRight: '0.5rem' }} onClick={() => openEditModal(s, 'streams')}>Edit</button>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', color: '#ff4d4d' }} onClick={() => handleDelete(s.id, 'stream')}>Delete</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View Only</span>
                    )}
                  </td>
                </tr>
              ))}
              {activeTab === 'courses' && [...courses].filter(c => statusFilter === 'All' || (c.status || 'Open') === statusFilter).reverse().map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>{c.courseName}</td>
                  <td style={{ padding: '1rem' }}>{programs.find(p => p.id === c.programId)?.programName || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>{streams.find(s => s.id === c.streamId)?.streamName || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>₹{c.courseFee}</td>
                  <td style={{ padding: '1rem' }}>{formatToDisplayDate(c.launchedAt)}</td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(c.status || 'Open')}</td>
                  <td style={{ padding: '1rem' }}>
                    {canModify ? (
                      <>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', marginRight: '0.5rem' }} onClick={() => openEditModal(c, 'courses')}>Edit</button>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', color: '#ff4d4d' }} onClick={() => handleDelete(c.id, 'course')}>Delete</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View Only</span>
                    )}
                  </td>
                </tr>
              ))}
              {activeTab === 'batches' && [...batches].filter(b => statusFilter === 'All' || (b.status || 'Open') === statusFilter).reverse().map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>{b.batchName}</td>
                  <td style={{ padding: '1rem' }}>{streams.find(s => s.id === b.streamId)?.streamName || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>{courses.find(c => c.id === b.courseId)?.courseName || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>{b.startDate || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>{b.endDate || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(b.status || 'Open')}</td>
                  <td style={{ padding: '1rem' }}>
                    {canModify ? (
                      <>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', marginRight: '0.5rem' }} onClick={() => openEditModal(b, 'batches')}>Edit</button>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', color: '#ff4d4d' }} onClick={() => handleDelete(b.id, 'batch')}>Delete</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View Only</span>
                    )}
                  </td>
                </tr>
              ))}
              {activeTab === 'job_titles' && [...jobTitles].map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '1rem' }}>{j.titleName}</td>
                  <td style={{ padding: '1rem' }}>{formatToDisplayDate(j.createdAt)}</td>
                  <td style={{ padding: '1rem' }}>
                    {canModify ? (
                      <>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', marginRight: '0.5rem' }} onClick={() => openEditModal(j, 'job_titles')}>Edit</button>
                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', color: '#ff4d4d' }} onClick={() => handleDelete(j.id, 'job-title')}>Delete</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
            <h3 style={{ fontFamily: 'Outfit', marginBottom: '1.5rem', textTransform: 'capitalize' }}>
              {showModal.data ? 'Edit' : 'Add'} {showModal.type.replace('-', ' ')}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>
              {errors.length > 0 && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', borderRadius: '8px', color: '#ff4d4d', fontSize: '0.85rem' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <label className="form-label">{showModal.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Name</label>
                <input type="text" className="form-input" required value={itemName} onChange={e => setItemName(e.target.value)} />
              </div>

              {showModal.type !== 'job-title' && (
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={status} onChange={e => setStatus(e.target.value as ProgramStatus)} style={{ backgroundColor: '#111', color: 'white' }}>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>
              )}

              {showModal.type === 'stream' && (
                <div>
                  <label className="form-label">Program</label>
                  <select className="form-input" required value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} style={{ backgroundColor: '#111', color: 'white' }}>
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.programName}</option>)}
                  </select>
                </div>
              )}

              {showModal.type === 'course' && (
                <>
                  <div>
                    <label className="form-label">Program</label>
                    <select className="form-input" required value={selectedProgramId} onChange={e => { setSelectedProgramId(e.target.value); setSelectedStreamId(''); }} style={{ backgroundColor: '#111', color: 'white' }}>
                      <option value="">Select Program</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.programName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Stream</label>
                    <select className="form-input" required value={selectedStreamId} onChange={e => setSelectedStreamId(e.target.value)} style={{ backgroundColor: '#111', color: 'white' }}>
                      <option value="">Select Stream</option>
                      {streams.filter(s => s.programId === selectedProgramId).map(s => <option key={s.id} value={s.id}>{s.streamName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Course Fee (₹)</label>
                    <input type="number" className="form-input" required value={fee} onChange={e => setFee(e.target.value)} />
                  </div>
                </>
              )}

              {showModal.type === 'batch' && (
                <>
                  <div>
                    <label className="form-label">Program</label>
                    <select className="form-input" required value={selectedProgramId} onChange={e => { setSelectedProgramId(e.target.value); setSelectedStreamId(''); setSelectedCourseId(''); }} style={{ backgroundColor: '#111', color: 'white' }}>
                      <option value="">Select Program</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.programName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Stream</label>
                    <select className="form-input" required value={selectedStreamId} onChange={e => { setSelectedStreamId(e.target.value); setSelectedCourseId(''); }} style={{ backgroundColor: '#111', color: 'white' }}>
                      <option value="">Select Stream</option>
                      {streams.filter(s => s.programId === selectedProgramId).map(s => <option key={s.id} value={s.id}>{s.streamName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Course</label>
                    <select className="form-input" required value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} style={{ backgroundColor: '#111', color: 'white' }}>
                      <option value="">Select Course</option>
                      {courses.filter(c => c.streamId === selectedStreamId).map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Start Date (DD/MM/YYYY)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="DD/MM/YYYY"
                        style={{ color: '#fff', borderColor: dateErrors.start ? '#ff4d4d' : undefined }}
                        value={startDate} 
                        onChange={e => {
                          let val = e.target.value;
                          if (val.length === 2 && !val.includes('/')) val += '/';
                          if (val.length === 5 && val.split('/').length === 2) val += '/';
                          if (val.length > 10) val = val.substring(0, 10);
                          setStartDate(val);
                          
                          if (val.length === 10) {
                            const res = validateBatchDate(val);
                            setDateErrors(prev => ({ ...prev, start: res.isValid ? undefined : res.error }));
                          } else {
                            setDateErrors(prev => ({ ...prev, start: undefined }));
                          }
                        }}
                        onBlur={() => {
                          if (startDate) {
                            const res = validateBatchDate(startDate);
                            setDateErrors(prev => ({ ...prev, start: res.isValid ? undefined : res.error }));
                          }
                        }}
                      />
                      {dateErrors.start && <small style={{ color: '#ff4d4d', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>{dateErrors.start}</small>}
                    </div>
                    <div>
                      <label className="form-label">End Date (DD/MM/YYYY)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="DD/MM/YYYY"
                        style={{ color: '#fff', borderColor: dateErrors.end ? '#ff4d4d' : undefined }}
                        value={endDate} 
                        onChange={e => {
                          let val = e.target.value;
                          if (val.length === 2 && !val.includes('/')) val += '/';
                          if (val.length === 5 && val.split('/').length === 2) val += '/';
                          if (val.length > 10) val = val.substring(0, 10);
                          setEndDate(val);
                          
                          if (val.length === 10) {
                            const res = validateBatchDate(val);
                            setDateErrors(prev => ({ ...prev, end: res.isValid ? undefined : res.error }));
                          } else {
                            setDateErrors(prev => ({ ...prev, end: undefined }));
                          }
                        }}
                        onBlur={() => {
                          if (endDate) {
                            const res = validateBatchDate(endDate);
                            setDateErrors(prev => ({ ...prev, end: res.isValid ? undefined : res.error }));
                          }
                        }}
                      />
                      {dateErrors.end && <small style={{ color: '#ff4d4d', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>{dateErrors.end}</small>}
                    </div>
                  </div>
                </>
              )}

              {showModal.type !== 'batch' && showModal.type !== 'job-title' && (
                <div>
                  <label className="form-label">Launched On (DD/MM/YYYY)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="DD/MM/YYYY"
                    required 
                    value={launchedAt} 
                    onChange={e => setLaunchedAt(e.target.value)} 
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(null)}>Cancel</button>
                <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {notification && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '380px', padding: '2rem', textAlign: 'center', border: `1px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--purple)'}33` }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: notification.type === 'success' ? 'var(--success)' : 'var(--purple)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              boxShadow: `0 0 20px ${notification.type === 'success' ? 'var(--success)' : 'var(--purple)'}44`
            }}>
              {notification.type === 'success' ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              )}
            </div>
            <h3 style={{ fontFamily: 'Outfit', marginBottom: '0.75rem', fontSize: '1.25rem' }}>{notification.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>{notification.message}</p>
            <button className="btn-gradient" style={{ width: '100%', padding: '0.8rem' }} onClick={() => setNotification(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      {pendingAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'rgba(255,165,0,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              border: '2px solid orange'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="orange" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
            </div>
            <h3 style={{ fontFamily: 'Outfit', marginBottom: '1rem', fontSize: '1.4rem' }}>{pendingAction.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}>{pendingAction.message}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button 
                className="btn-outline" 
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-gradient" 
                onClick={() => {
                  pendingAction.onConfirm();
                  setPendingAction(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
