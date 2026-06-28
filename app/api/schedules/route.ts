export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Schedule } from '@/lib/store';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schedules = readData<Schedule[]>('schedules.json', []);
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;

  if (!session || !['admin', 'master', 'staff'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const schedules = readData<Schedule[]>('schedules.json', []);

    // Validation
    const requiredFields = [
      'date',
      'startTime',
      'endTime',
      'subjectId',
      'subjectName',
      'teacherId',
      'teacherName',
      'batchIds',
      'batchNames',
    ];

    for (const field of requiredFields) {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const newSchedule: Schedule = {
      id: 'SCH-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      batchIds: data.batchIds,
      batchNames: data.batchNames,
      pdfLink: data.pdfLink || '',
      videoUrl: data.videoUrl || '',
      createdAt: new Date().toISOString(),
    };

    schedules.push(newSchedule);
    writeData('schedules.json', schedules);

    return NextResponse.json(newSchedule);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
