export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Batch } from '@/lib/store';
import { auth } from '@/lib/auth';

export async function GET() {
  const batches = readData<Batch[]>('batches.json', []);
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const batchData = await req.json();
    const batches = readData<Batch[]>('batches.json', []);
    
    const newBatch: Batch = {
      status: 'Open',
      startDate: batchData.startDate || '',
      endDate: batchData.endDate || '',
      ...batchData,
      id: 'BAT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    
    batches.push(newBatch);
    writeData('batches.json', batches);
    
    return NextResponse.json(newBatch);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}
