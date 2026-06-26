'use client';
import DashboardLayout from '@/components/DashboardLayout';
import LeadsManagement from '@/components/LeadsManagement';
import { MASTER_NAV_ITEMS } from '@/lib/roles';

export default function MasterLeadsPage() {
  return (
    <DashboardLayout title="Master Lead Manager" navItems={MASTER_NAV_ITEMS}>
      <LeadsManagement />
    </DashboardLayout>
  );
}
