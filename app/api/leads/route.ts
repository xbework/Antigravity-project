export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Lead } from '@/lib/store';
import { auth } from '@/lib/auth';

export async function GET() {
  const leads = readData<Lead[]>('leads.json', []);
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const leadData = await req.json();
    const leads = readData<Lead[]>('leads.json', []);
    
    const newLead: Lead = {
      ...leadData,
      id: 'LED-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: 'New',
      appointmentHistory: [],
      createdAt: new Date().toISOString(),
    };
    
    leads.unshift(newLead);
    writeData('leads.json', leads);
    
    return NextResponse.json(newLead);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
