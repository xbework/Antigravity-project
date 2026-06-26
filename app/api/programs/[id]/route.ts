import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Program } from '@/lib/store';
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
    const body = await req.json();
    const programs = readData<Program[]>('programs.json', []);
    const index = programs.findIndex(i => i.id === id);
    
    if (index !== -1) {
      const oldStatus = programs[index].status;
      const newStatus = body.status;
      
      programs[index] = { ...programs[index], ...body };
      writeData('programs.json', programs);

      // Hierarchical Status Dependency: If Program is closed, close all related items
      if (newStatus === 'Closed' && oldStatus !== 'Closed') {
        // Update Streams
        const streams = readData<any[]>('streams.json', []);
        streams.forEach(s => {
          if (s.programId === id) s.status = 'Closed';
        });
        writeData('streams.json', streams);

        // Update Courses
        const courses = readData<any[]>('courses.json', []);
        courses.forEach(c => {
          if (c.programId === id) c.status = 'Closed';
        });
        writeData('courses.json', courses);

        // Update Batches
        const batches = readData<any[]>('batches.json', []);
        const streamIds = streams.filter(s => s.programId === id).map(s => s.id);
        batches.forEach(b => {
          if (streamIds.includes(b.streamId)) b.status = 'Closed';
        });
        writeData('batches.json', batches);
      }

      return NextResponse.json(programs[index]);
    }
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
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
    const data = readData<Program[]>('programs.json', []);
    const filtered = data.filter(i => i.id !== id);
    writeData('programs.json', filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
