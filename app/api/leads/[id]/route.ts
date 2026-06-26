import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';
import { Lead, Appointment } from '@/lib/store';
import { auth } from '@/lib/auth';
 
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leads = readData<Lead[]>('leads.json', []);
    const lead = leads.find(l => l.id === id);
    if (lead) {
      return NextResponse.json(lead);
    }
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

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
    const leads = readData<Lead[]>('leads.json', []);
    
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      // Handle special case for appointments
      if (body.type === 'appointment') {
        const { dateTime, notes, previousRemarks } = body;
        const lead = leads[index];
        if (!lead.appointmentHistory) lead.appointmentHistory = [];

        // 1. Update previous remarks if provided
        // We update the most recent appointment's notes if it's NOT the one we're currently scheduling/updating as "next"
        if (previousRemarks !== undefined && lead.appointmentHistory.length > 0) {
          // If we have a nextAppointment, we might want to update the one BEFORE it, 
          // or if the user is just updating the current next one's "completed" state.
          // To keep it simple and match common usage: update the last one.
          lead.appointmentHistory[lead.appointmentHistory.length - 1].notes = previousRemarks;
        }

        // 2. Handle Next Appointment
        if (dateTime) {
          // Check if we are updating an existing scheduled appointment or adding a new one
          // If the lead already has a nextAppointment, we check if it's the one we're updating
          const existingNextIndex = lead.appointmentHistory.findIndex(a => a.appointmentDateTime === lead.nextAppointment);
          
          if (existingNextIndex !== -1) {
            // Update existing
            lead.appointmentHistory[existingNextIndex].appointmentDateTime = dateTime;
            lead.appointmentHistory[existingNextIndex].notes = notes;
            lead.appointmentHistory[existingNextIndex].updatedAt = new Date().toISOString();
          } else {
            // Add new
            const newAppointment: Appointment = {
              id: Math.random().toString(36).substr(2, 9).toUpperCase(),
              appointmentDateTime: dateTime,
              notes: notes,
              status: 'Scheduled',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            lead.appointmentHistory.push(newAppointment);
          }
          lead.nextAppointment = dateTime;
        } else {
          // If no new appointment is scheduled, clear the nextAppointment flag
          lead.nextAppointment = undefined;
        }
      } else {
        // Standard data update
        leads[index] = { ...leads[index], ...body };
      }
      
      writeData('leads.json', leads);
      return NextResponse.json(leads[index]);
    }
    
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
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
    const leads = readData<Lead[]>('leads.json', []);
    
    const filteredLeads = leads.filter(l => l.id !== id);
    if (filteredLeads.length !== leads.length) {
      writeData('leads.json', filteredLeads);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
