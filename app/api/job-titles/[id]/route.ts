import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { auth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const { id } = params;
    const body = await req.json();
    const data = readData<any[]>('job-titles.json', []);
    
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    data[index] = { ...data[index], ...body };
    writeData('job-titles.json', data);
    
    return NextResponse.json(data[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job title' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const { id } = params;
    const data = readData<any[]>('job-titles.json', []);
    
    const initialLength = data.length;
    const filteredData = data.filter(item => item.id !== id);
    
    if (filteredData.length === initialLength) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    writeData('job-titles.json', filteredData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job title' }, { status: 500 });
  }
}
