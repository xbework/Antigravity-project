'use client';
import DashboardLayout from '@/components/DashboardLayout';
import LeadsManagement from '@/components/LeadsManagement';
import { ADMIN_NAV_ITEMS } from '@/lib/roles';

export default function AdminLeadsPage() {
  return (
    <DashboardLayout title="Lead Pipeline" navItems={ADMIN_NAV_ITEMS}>
      <LeadsManagement />
    </DashboardLayout>
  );
}
