export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Stream } from '@/lib/store';
import { auth } from '@/lib/auth';

export async function GET() {
  const data = readData<Stream[]>('streams.json', []);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const data = readData<Stream[]>('streams.json', []);
    const newItem: Stream = {
      status: 'Open',
      ...body,
      id: 'STRM-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    };
    data.push(newItem);
    writeData('streams.json', data);
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
