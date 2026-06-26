import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Stream } from '@/lib/store';
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
    const streams = readData<Stream[]>('streams.json', []);
    const index = streams.findIndex(i => i.id === id);
    if (index !== -1) {
      const oldStatus = streams[index].status;
      const newStatus = body.status;
      
      streams[index] = { ...streams[index], ...body };
      writeData('streams.json', streams);

      // Hierarchical Status Dependency: If Stream is closed, close all related items
      if (newStatus === 'Closed' && oldStatus !== 'Closed') {
        // Update Courses
        const courses = readData<any[]>('courses.json', []);
        courses.forEach(c => {
          if (c.streamId === id) c.status = 'Closed';
        });
        writeData('courses.json', courses);

        // Update Batches
        const batches = readData<any[]>('batches.json', []);
        batches.forEach(b => {
          if (b.streamId === id) b.status = 'Closed';
        });
        writeData('batches.json', batches);
      }

      return NextResponse.json(streams[index]);
    }
    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
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
    const data = readData<Stream[]>('streams.json', []);
    const filtered = data.filter(i => i.id !== id);
    writeData('streams.json', filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
  }
}
