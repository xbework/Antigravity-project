export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { auth } from '@/lib/auth';

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  date: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  students: {
    studentId: string;
    studentName: string;
    status: 'Present' | 'Absent';
  }[];
  markedBy: string;
  createdAt: string;
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const attendance = readData<AttendanceRecord[]>('attendance.json', []);
  return NextResponse.json(attendance);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  const userId = (session?.user as any)?.id || 'unknown';

  if (!session || !['admin', 'master', 'staff'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const attendanceLogs = readData<AttendanceRecord[]>('attendance.json', []);

    // Validation
    const requiredFields = [
      'scheduleId',
      'date',
      'subjectId',
      'subjectName',
      'teacherId',
      'teacherName',
      'students'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if attendance already marked for this scheduleId, if so we update it.
    const existingIndex = attendanceLogs.findIndex(log => log.scheduleId === data.scheduleId);
    
    const record: AttendanceRecord = {
      id: existingIndex !== -1 ? attendanceLogs[existingIndex].id : 'ATT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      scheduleId: data.scheduleId,
      date: data.date,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      students: data.students,
      markedBy: userId,
      createdAt: existingIndex !== -1 ? attendanceLogs[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      attendanceLogs[existingIndex] = record;
    } else {
      attendanceLogs.push(record);
    }

    writeData('attendance.json', attendanceLogs);

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Failed to save attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
