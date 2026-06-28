export type LeadStatus = 'New' | 'Contacted' | 'Connected' | 'Interested' | 'Not Interested' | 'Registered' | 'Follow-up Required';

export interface Appointment {
  id: string;
  appointmentDateTime: string;
  notes?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProgramStatus = 'Open' | 'Closed' | 'Postponed';

export interface Program {
  id: string;
  programName: string;
  launchedAt: string;
  status: ProgramStatus;
}

export interface Stream {
  id: string;
  streamName: string;
  programId: string;
  launchedAt: string;
  status: ProgramStatus;
}

export interface Course {
  id: string;
  courseName: string;
  programId: string;
  streamId: string;
  courseFee: number;
  courseType?: 'Tuition' | 'Technical courses';
  launchedAt: string;
  createdBy: string;
  createdAt: string;
  status: ProgramStatus;
}

export interface Batch {
  id: string;
  batchName: string;
  streamId: string;
  courseId: string;
  launchedAt: string;
  createdAt: string;
  status: ProgramStatus;
  startDate: string;
  endDate: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  contactNo: string;
  programId?: string;
  streamId?: string;
  courseId?: string;
  source?: string;
  status: LeadStatus;
  occupation?: 'student' | 'working' | 'non-working';
  nextAppointment?: string;
  appointmentHistory: Appointment[];
  createdAt: string;
  // Legacy fields for mapping
  category?: string;
  lookingFor?: string;
  phone?: string;
  location?: string;
  standard?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For base credentials login
  role: string;
  avatar?: string;
  masterPriority?: 'A1' | 'B1' | 'C1'; // Indicates eligibility for Master Mode
  masterPassword?: string; // Secondary password for Master Mode switch
  linkedStaffId?: string;
  appointedAs?: string;
  exactDuty?: string;
  course?: 'Tuition' | 'Technical courses';
  assignedAt: string;
  
  // --- Extended Profile & View Details ---
  address?: string;
  qualifications?: string;
  extraSkills?: string;
  
  // Student Registration Details
  fatherName?: string;
  aadhaarNo?: string;
  photo?: string;
  studentType?: 'student' | 'working' | 'non-working';
  schoolName?: string;
  companyName?: string;
  position?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  hobbies?: string;
  batchId?: string;
  admissionDate?: string;
  
  // Compensation & Fees
  salaryDetails?: { current: number; average: number };
  paymentDetails?: { 
    paid: number; 
    remaining: number; 
    feeOfCourse?: number; 
    admissionFee?: number; 
    facilityFee?: number; 
    maintenanceFee?: number;
    discount?: number;
  };
  
  // Activity metrics
  attendance?: number;
  classesAttended?: number;
  classesTakenTime?: string;
  screenTime?: string;
}

export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  batchIds: string[];
  batchNames: string[];
  pdfLink?: string;
  videoUrl?: string;
  createdAt: string;
}


// In-memory persistent stores
const leads: Lead[] = [];
const users: User[] = [
  { 
    id: '1', 
    name: 'Admin User', 
    email: 'admin@xbe.academy', 
    password: 'admin123', 
    role: 'admin', 
    avatar: 'AU',
    assignedAt: new Date().toISOString()
  },
];

const programs: Program[] = [];
const streams: Stream[] = [];
const courses: Course[] = [];
const batches: Batch[] = [];

export const getPrograms = () => programs;
export const addProgram = (program: Omit<Program, 'id'>) => {
  const newProgram: Program = {
    ...program,
    id: 'PROG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    status: 'Open'
  };
  programs.push(newProgram);
  return newProgram;
};
export const updateProgram = (id: string, updates: Partial<Program>) => {
  const program = programs.find(p => p.id === id);
  if (program) {
    Object.assign(program, updates);
    return program;
  }
  return null;
};
export const deleteProgram = (id: string) => {
  const index = programs.findIndex(p => p.id === id);
  if (index !== -1) {
    programs.splice(index, 1);
    return true;
  }
  return false;
};

export const getStreams = () => streams;
export const addStream = (stream: Omit<Stream, 'id'>) => {
  const newStream: Stream = {
    ...stream,
    id: 'STRM-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    status: 'Open'
  };
  streams.push(newStream);
  return newStream;
};
export const updateStream = (id: string, updates: Partial<Stream>) => {
  const stream = streams.find(s => s.id === id);
  if (stream) {
    Object.assign(stream, updates);
    return stream;
  }
  return null;
};
export const deleteStream = (id: string) => {
  const index = streams.findIndex(s => s.id === id);
  if (index !== -1) {
    streams.splice(index, 1);
    return true;
  }
  return false;
};

export const getLeads = () => leads;
// ... (rest of functions remain but need interface updates in their implementation if they access old fields)

export const addLead = (lead: Omit<Lead, 'id' | 'createdAt' | 'appointmentHistory' | 'status'>) => {
  const newLead: Lead = {
    ...lead,
    id: 'LED-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    status: 'New',
    appointmentHistory: [],
    createdAt: new Date().toISOString(),
  };
  leads.unshift(newLead);
  return newLead;
};

export const updateLead = (id: string, updates: Partial<Lead>) => {
  const index = leads.findIndex(l => l.id === id);
  if (index !== -1) {
    leads[index] = { ...leads[index], ...updates };
    return leads[index];
  }
  return null;
};

export const addAppointment = (leadId: string, appointmentDateTime: string, notes?: string) => {
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      appointmentDateTime,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
    };
    lead.appointmentHistory.push(newAppointment);
    lead.nextAppointment = appointmentDateTime;
    return newAppointment;
  }
  return null;
};

export const getCourses = () => courses;

export const addCourse = (courseName: string, courseType: 'Tuition' | 'Technical courses', programId: string, streamId: string, courseFee: number, launchedAt: string, createdBy: string) => {
  const newCourse: Course = {
    id: 'CRS-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    courseName,
    courseType,
    programId,
    streamId,
    courseFee,
    launchedAt,
    createdBy,
    createdAt: new Date().toISOString(),
    status: 'Open'
  };
  courses.push(newCourse);
  return newCourse;
};

export const updateCourse = (id: string, updates: Partial<Course>) => {
  const course = courses.find(c => c.id === id);
  if (course) {
    Object.assign(course, updates);
    return course;
  }
  return null;
};

export const deleteCourse = (id: string) => {
  const index = courses.findIndex(c => c.id === id);
  if (index !== -1) {
    courses.splice(index, 1);
    return true;
  }
  return false;
};

export const getBatches = () => batches;

export const addBatch = (batch: Omit<Batch, 'id' | 'createdAt'>) => {
  const newBatch: Batch = {
    ...batch,
    id: 'BAT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    createdAt: new Date().toISOString(),
    status: 'Open',
    startDate: batch.startDate || '',
    endDate: batch.endDate || ''
  };
  batches.push(newBatch);
  return newBatch;
};

export const updateBatch = (id: string, updates: Partial<Batch>) => {
  const batch = batches.find(b => b.id === id);
  if (batch) {
    Object.assign(batch, updates);
    return batch;
  }
  return null;
};

export const deleteBatch = (id: string) => {
  const index = batches.findIndex(b => b.id === id);
  if (index !== -1) {
    batches.splice(index, 1);
    return true;
  }
  return false;
};

export const getLeadByEmail = (email: string) => 
  leads.find(l => l.email.toLowerCase() === email.toLowerCase());

// User Management
export const getUsers = () => users;
export const getStaffs = () => users.filter(u => u.role === 'staff');
export const getMasters = () => users.filter(u => u.role === 'master');

export const searchStaffs = (query: string) => {
  const q = query.toLowerCase();
  return getStaffs().filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.email.toLowerCase().includes(q) || 
    s.id.toLowerCase().includes(q)
  );
};

export const addUser = (user: Omit<User, 'id' | 'assignedAt'>) => {
  const newUser: User = {
    ...user,
    id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    assignedAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
};
