import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readData } from '@/lib/storage';
import { User } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await req.json();
    const users = readData<User[]>('users.json', []);
    const user = users.find(u => u.email === session?.user?.email);

    if (!user || !user.masterPriority) {
      return NextResponse.json({ error: 'Not eligible for master mode' }, { status: 403 });
    }

    // In a real app, use bcrypt.compare. For this prototype, we'll check directly or use the same hashing.
    // Assuming simple check for now as per current store logic
    if (user.masterPassword === password) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid master access password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
