'use server';
import { addLead } from '@/lib/store';
import { redirect } from 'next/navigation';

export async function submitLead(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const location = formData.get('location') as string;
  const standard = formData.get('standard') as string;

  addLead({ 
    name, 
    email, 
    phone, 
    location, 
    standard,
    contactNo: phone || '',
    category: 'Tuition',
    lookingFor: standard || ''
  });
  
  // In a real app, you might update the session here too
  redirect('/freetrial');
}
