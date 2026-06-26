'use client';
import DashboardLayout from '@/components/DashboardLayout';
import CurriculumManagement from '@/components/CurriculumManagement';
import { MASTER_NAV_ITEMS } from '@/lib/roles';

export default function MasterCoursesPage() {
  return (
    <DashboardLayout title="Structure of the Firm" navItems={MASTER_NAV_ITEMS}>
      <CurriculumManagement />
    </DashboardLayout>
  );
}
