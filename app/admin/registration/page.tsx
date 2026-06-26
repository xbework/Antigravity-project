'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Lead, Program, Stream, Course, User, Batch } from '@/lib/store';
import { formatDateToUI, parseUIDateToISO, validateDOB, validateDateStrict } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function RegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string;
  const canModify = ['admin', 'master'].includes(userRole);

  const leadId = searchParams.get('leadId');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lead, setLead] = useState<Lead | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [registeredStudentId, setRegisteredStudentId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    fatherName: '',
    address: '',
    aadhaarNo: '',
    photo: '',
    studentType: 'student' as 'student' | 'working' | 'non-working',
    schoolName: '',
    companyName: '',
    position: '',
    qualifications: '',
    programId: '',
    streamId: '',
    courseId: '',
    admissionFee: '' as any,
    discount: 0,
    courseFee: 0,
    confirmFee: false,
    batchId: '',
    dob: '',
    bloodGroup: '',
    gender: '',
    hobbies: '',
    admissionDate: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes, cRes, bRes] = await Promise.all([
          fetch('/api/programs'),
          fetch('/api/streams'),
          fetch('/api/courses'),
          fetch('/api/batches')
        ]);
        if (pRes.ok) setPrograms(await pRes.json());
        if (sRes.ok) setStreams(await sRes.json());
        if (cRes.ok) setCourses(await cRes.json());
        if (bRes.ok) setBatches(await bRes.json());

        if (leadId) {
          const lRes = await fetch(`/api/leads/${leadId}`);
          if (lRes.ok) {
            const leadData: Lead = await lRes.json();
            setLead(leadData);
            setFormData(prev => ({
              ...prev,
              name: leadData.name,
              email: leadData.email,
              programId: leadData.programId,
              streamId: leadData.streamId,
              courseId: leadData.courseId || '',
              studentType: leadData.occupation || 'student',
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [leadId]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const regId = Math.random().toString(36).substr(2, 6).toUpperCase();
      const photoName = `${formData.name.replace(/\s+/g, '').toLowerCase()}${regId}`;
      
      const studentData: Omit<User, 'id' | 'assignedAt'> & { id: string } = {
        id: regId,
        name: formData.name,
        email: formData.email,
        role: 'student',
        fatherName: formData.fatherName,
        address: formData.address,
        aadhaarNo: formData.aadhaarNo,
        photo: formData.photo ? photoName : '', // Simulating renaming
        studentType: formData.studentType,
        schoolName: formData.schoolName,
        companyName: formData.companyName,
        position: formData.position,
        qualifications: formData.qualifications,
        dob: parseUIDateToISO(formData.dob),
        bloodGroup: formData.bloodGroup,
        gender: formData.gender,
        hobbies: formData.hobbies,
        batchId: formData.batchId,
        admissionDate: parseUIDateToISO(formData.admissionDate),
        paymentDetails: {
          paid: 0,
          remaining: formData.courseFee + (Number(formData.admissionFee) || 0) - (Number(formData.discount) || 0),
          feeOfCourse: formData.courseFee,
          admissionFee: Number(formData.admissionFee) || 0,
          discount: Number(formData.discount) || 0,
        }
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      if (res.ok) {
        // Update lead status to Registered
        if (leadId) {
          await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Registered' }),
          });
        }
        
        const newStudent = await res.json();
        setRegisteredStudentId(newStudent.id);
        setShowAnimation(true);
        setTimeout(() => {
          router.push(`/admin/users/students`);
        }, 4000);
      }
    } catch (error) {
      console.error('Failed to register student:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === formData.courseId);
  const totalFee = (selectedCourse?.courseFee || 0) + (Number(formData.admissionFee) || 0) - (Number(formData.discount) || 0);

  useEffect(() => {
    if (selectedCourse) {
      setFormData(prev => ({ ...prev, courseFee: selectedCourse.courseFee }));
    }
  }, [selectedCourse]);

  if (session && !canModify) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit', color: '#ff4d4d', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Only Admin or Master roles are authorized to register students.</p>
        <button className="btn-outline" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Student Registration</h1>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', justifyContent: 'center' }}>
          {[1, 2, 3].map(step => (
            <div key={step} style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: currentStep >= step ? 'var(--gradient-primary)' : 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
              transition: 'all 0.3s ease', border: currentStep === step ? '2px solid #fff' : 'none'
            }}>
              {step}
            </div>
          ))}
        </div>

        <div className="glass-card animate-fade" style={{ padding: '3rem', position: 'relative' }}>
          {currentStep === 1 && (
            <div className="animate-slide-up">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Personal Details</h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div>
                    <label className="form-label">Full Name <span style={{color: '#ff4d4d'}}>*</span></label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-light)' }}>{formData.name || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="form-label">Email Address <span style={{color: '#ff4d4d'}}>*</span></label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-light)' }}>{formData.email || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Father's Name</label>
                  <input type="text" className="form-input" placeholder="Enter father's name" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows={3} placeholder="Enter full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Aadhaar ID NO</label>
                    <input type="text" className="form-input" placeholder="0000-0000-0000" value={formData.aadhaarNo} onChange={e => setFormData({...formData, aadhaarNo: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Student Photo</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 64 * 1024) {
                            alert('File size must be less than 64KB');
                            e.target.value = '';
                            return;
                          }
                          setFormData({...formData, photo: URL.createObjectURL(file)});
                        }
                      }} 
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Max size: 64KB</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Date of Birth <span style={{color: '#ff4d4d'}}>*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="DD/MM/YYYY"
                      style={{ color: '#fff', borderColor: errors.dob ? '#ff4d4d' : undefined }}
                      value={formData.dob} 
                      onChange={e => {
                        let val = e.target.value;
                        if (val.length === 2 && !val.includes('/')) val += '/';
                        if (val.length === 5 && val.split('/').length === 2) val += '/';
                        if (val.length > 10) val = val.substring(0, 10);
                        setFormData({...formData, dob: val});
                        
                        if (val.length === 10) {
                          const dobResult = validateDateStrict(val.replace(/\//g, '-'));
                          setErrors(prev => ({ ...prev, dob: dobResult.isValid ? '' : (dobResult.error || 'Invalid date') }));
                        } else {
                          setErrors(prev => ({ ...prev, dob: '' }));
                        }
                      }} 
                      onBlur={() => {
                        if (formData.dob) {
                          const dobResult = validateDateStrict(formData.dob.replace(/\//g, '-'));
                          setErrors(prev => ({ ...prev, dob: dobResult.isValid ? '' : (dobResult.error || 'Invalid date') }));
                        }
                      }}
                    />
                    {errors.dob && <small style={{ color: '#ff4d4d', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>{errors.dob}</small>}
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Format: DD/MM/YYYY</small>
                  </div>
                  <div>
                    <label className="form-label">Blood Group <span style={{color: '#ff4d4d'}}>*</span></label>
                    <select 
                      className="form-input" 
                      style={{ backgroundColor: '#111', color: '#fff' }}
                      value={formData.bloodGroup} 
                      onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                    >
                      <option value="">Select Blood Group...</option>
                      {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Gender <span style={{color: '#ff4d4d'}}>*</span></label>
                    <select 
                      className="form-input" 
                      style={{ backgroundColor: '#111', color: '#fff' }}
                      value={formData.gender} 
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="">Select Gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Hobbies</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Reading, Cricket" 
                      value={formData.hobbies} 
                      onChange={e => setFormData({...formData, hobbies: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-slide-up">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Academic / Professional Details</h2>
              <div style={{ display: 'grid', gap: '2rem' }}>
                <div className="badge badge-purple" style={{ padding: '0.5rem 1rem', display: 'inline-block', width: 'fit-content' }}>
                  Current Status: <span style={{ textTransform: 'capitalize' }}>{lead?.occupation || 'Selected in Lead'}</span>
                </div>

                {(lead?.occupation === 'student' || formData.studentType === 'student') && (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                      <label className="form-label">School / College studying</label>
                      <input type="text" className="form-input" placeholder="Name of institution" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Qualification / Standard</label>
                      <input type="text" className="form-input" placeholder="e.g. 10th Standard / B.Tech" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} />
                    </div>
                  </div>
                )}

                {(lead?.occupation === 'working' || formData.studentType === 'working') && (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                      <label className="form-label">Name of the company</label>
                      <input type="text" className="form-input" placeholder="Current company name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Posted as</label>
                      <input type="text" className="form-input" placeholder="Job title / Designation" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Qualification</label>
                      <input type="text" className="form-input" placeholder="Highest degree" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} />
                    </div>
                  </div>
                )}

                {(lead?.occupation === 'non-working' || formData.studentType === 'non-working') && (
                  <div>
                    <label className="form-label">Qualification</label>
                    <input type="text" className="form-input" placeholder="Highest degree" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-slide-up">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Course & Fee Details</h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '1rem' }}>
                  <label className="form-label">Course (Selected from Lead) <span style={{color: '#ff4d4d'}}>*</span></label>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {courses.find(c => c.id === formData.courseId)?.courseName || 'No course selected in lead'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Course Fee (Auto)</label>
                    <input type="text" className="form-input" readOnly value={selectedCourse?.courseFee || 0} style={{ opacity: 0.7, background: 'rgba(255,255,255,0.02)' }} />
                  </div>
                  <div>
                    <label className="form-label">Admission Fee <span style={{color: '#ff4d4d'}}>*</span></label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Enter fee amount"
                      value={formData.admissionFee} 
                      onChange={e => setFormData({...formData, admissionFee: e.target.value === '' ? '' : Number(e.target.value)})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ color: 'white' }}>Batch Selection <span style={{color: '#ff4d4d'}}>*</span></label>
                  <select 
                    className="form-input" 
                    style={{ backgroundColor: '#111', color: 'white' }} 
                    required 
                    value={formData.batchId} 
                    onChange={e => setFormData({...formData, batchId: e.target.value})}
                  >
                    <option value="">Select Target Batch...</option>
                    {batches
                      .filter(b => b.courseId === formData.courseId && b.streamId === formData.streamId)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.batchName}</option>
                      ))
                    }
                  </select>
                  {batches.filter(b => b.courseId === formData.courseId && b.streamId === formData.streamId).length === 0 && (
                    <small style={{ color: 'var(--warning)', marginTop: '0.25rem', display: 'block' }}>No batches currently available for this course/stream.</small>
                  )}
                </div>

                <div>
                  <label className="form-label">Discount</label>
                  <input type="number" className="form-input" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} />
                </div>

                <div>
                  <label className="form-label">Date of Admission <span style={{color: '#ff4d4d'}}>*</span></label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="DD/MM/YYYY"
                    style={{ color: '#fff', borderColor: errors.admissionDate ? '#ff4d4d' : undefined }}
                    value={formData.admissionDate} 
                    onChange={e => {
                      let val = e.target.value;
                      if (val.length === 2 && !val.includes('/')) val += '/';
                      if (val.length === 5 && val.split('/').length === 2) val += '/';
                      if (val.length > 10) val = val.substring(0, 10);
                      setFormData({...formData, admissionDate: val});
                      
                      if (val.length === 10) {
                        const dateResult = validateDateStrict(val.replace(/\//g, '-'));
                        setErrors(prev => ({ ...prev, admissionDate: dateResult.isValid ? '' : (dateResult.error || 'Invalid date') }));
                      } else {
                        setErrors(prev => ({ ...prev, admissionDate: '' }));
                      }
                    }} 
                    onBlur={() => {
                      if (formData.admissionDate) {
                        const dateResult = validateDateStrict(formData.admissionDate.replace(/\//g, '-'));
                        setErrors(prev => ({ ...prev, admissionDate: dateResult.isValid ? '' : (dateResult.error || 'Invalid date') }));
                      }
                    }}
                  />
                  {errors.admissionDate && <small style={{ color: '#ff4d4d', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>{errors.admissionDate}</small>}
                </div>

                <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Calculated Fee</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>₹{totalFee.toLocaleString()}</div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '1rem', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <input type="checkbox" checked={formData.confirmFee} onChange={e => setFormData({...formData, confirmFee: e.target.checked})} />
                  <span>Confirm the fee detail <span style={{color: '#ff4d4d'}}>*</span></span>
                </label>
              </div>
            </div>
          )}



          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
            <button className="btn-outline" onClick={handlePrev} disabled={currentStep === 1}>Previous</button>
            <button 
              className="btn-gradient" 
              onClick={handleNext} 
              disabled={
                loading || 
                (currentStep === 1 && (!formData.dob || !formData.bloodGroup || !formData.gender || !!errors.dob)) ||
                (currentStep === 3 && (
                  !formData.courseId || 
                  !formData.batchId ||
                  formData.admissionFee === '' || 
                  Number(formData.admissionFee) < 0 || 
                  Number(formData.discount) < 0 ||
                  !formData.confirmFee ||
                  !formData.admissionDate ||
                  !!errors.admissionDate
                ))
              }
            >
              {currentStep === 3 ? (loading ? 'Processing...' : 'Finish Registration') : 'Next Step'}
            </button>
          </div>
        </div>
      </div>

      {/* Walking Animation Modal */}
      {showAnimation && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <div className="walking-container">
            <div className="person">🚀🏃🎒</div>
          </div>
          <h2 style={{ fontFamily: 'Outfit', color: '#fff', textAlign: 'center' }}>Registration Successful!<br/><span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Moving forward with Xbe Academy</span></h2>
        </div>
      )}
    </div>
  );
}
