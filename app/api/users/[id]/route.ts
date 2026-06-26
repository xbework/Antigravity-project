export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { User } from '@/lib/store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const users = readData<User[]>('users.json', []);
    
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...body };
      writeData('users.json', users);
      return NextResponse.json(users[index]);
    }
    
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
