export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Course } from '@/lib/store';
import { auth } from '@/lib/auth';

export async function GET() {
  const courses = readData<Course[]>('courses.json', []);
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    // Destructure all expected fields, including new ones
    const courseData = await req.json();
    const courses = readData<Course[]>('courses.json', []);
    
    const newCourse: Course = {
      status: 'Open',
      ...courseData, 
      id: 'CRS-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    
    courses.push(newCourse);
    writeData('courses.json', courses);
    
    return NextResponse.json(newCourse);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
