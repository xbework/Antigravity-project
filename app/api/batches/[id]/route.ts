export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Batch } from '@/lib/store';
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
    const batches = readData<Batch[]>('batches.json', []);
    const index = batches.findIndex((b) => b.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    batches[index] = { ...batches[index], ...updates };
    writeData('batches.json', batches);

    return NextResponse.json(batches[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
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
    const batches = readData<Batch[]>('batches.json', []);
    const filtered = batches.filter((b) => b.id !== id);
    writeData('batches.json', filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
