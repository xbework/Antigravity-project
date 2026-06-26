import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { User } from '@/lib/store';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  const users = readData<User[]>('users.json', []);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as string;
  
  if (!session || !['admin', 'master'].includes(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const userData = await req.json();
    const users = readData<User[]>('users.json', []);
    
    // 1. Handle B1/C1: Link to existing staff
    if (userData.linkedStaffId && (userData.masterPriority === 'B1' || userData.masterPriority === 'C1')) {
      const index = users.findIndex(u => u.id === userData.linkedStaffId);
      if (index === -1) {
        return NextResponse.json({ error: 'Linked staff not found' }, { status: 404 });
      }

      // Update existing staff with master privileges
      users[index] = {
        ...users[index],
        masterPriority: userData.masterPriority,
        masterPassword: userData.password, // This is the secondary Master Access Password
      };

      console.log(`[MASTER ROLE ASSIGNED] Staff ${users[index].name} (${users[index].email}) assigned as ${userData.masterPriority}`);
      writeData('users.json', users);
      return NextResponse.json(users[index]);
    }

    // 2. Handle A1 or New User Creation (Normal Staff/Student)
    // Check if Email already exists (global check)
    if (userData.email && users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    let password = userData.password || 'password123';
    
    // If DOB is provided, use it to generate the password (DDMMYYYY)
    if (userData.dob) {
      // Format 2000-01-01 to 01012000
      const [y, m, d] = userData.dob.split('-');
      password = `${d}${m}${y}`;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: User = {
      ...userData,
      id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      password: hashedPassword, // Internal login password
      masterPassword: userData.role === ROLES.MASTER ? userData.password : undefined, // For A1
      masterPriority: userData.role === ROLES.MASTER ? userData.masterPriority : undefined,
      role: userData.role === ROLES.MASTER ? ROLES.STAFF : userData.role, // All masters are base-role Staff
      assignedAt: new Date().toISOString(),
    };

    if (userData.role === ROLES.MASTER) {
      console.log(`[A1 MASTER CREATED] New user ${newUser.name} created with Master A1 privileges.`);
    }
    
    users.push(newUser);
    writeData('users.json', users);
    
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save master/user' }, { status: 500 });
  }
}
