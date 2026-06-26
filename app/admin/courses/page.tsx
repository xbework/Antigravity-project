'use client';
import DashboardLayout from '@/components/DashboardLayout';
import CurriculumManagement from '@/components/CurriculumManagement';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';

export default function AdminCoursesPage() {
  return (
    <DashboardLayout title="Structure of the Firm" navItems={ADMIN_NAV_ITEMS}>
      <CurriculumManagement />
    </DashboardLayout>
  );
}
