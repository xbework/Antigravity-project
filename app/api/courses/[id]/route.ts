import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Course } from '@/lib/store';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const updates = await req.json();
    const courses = readData<Course[]>('courses.json', []);
    
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
      const oldStatus = courses[index].status;
      const newStatus = updates.status;

      courses[index] = { ...courses[index], ...updates };
      writeData('courses.json', courses);

      // Hierarchical Status Dependency: If Course is closed, close all related batches
      if (newStatus === 'Closed' && oldStatus !== 'Closed') {
        const batches = readData<any[]>('batches.json', []);
        batches.forEach(b => {
          if (b.courseId === id) b.status = 'Closed';
        });
        writeData('batches.json', batches);
      }

      return NextResponse.json(courses[index]);
    }
    
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const courses = readData<Course[]>('courses.json', []);
    
    const filteredCourses = courses.filter(c => c.id !== id);
    if (filteredCourses.length !== courses.length) {
      writeData('courses.json', filteredCourses);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
