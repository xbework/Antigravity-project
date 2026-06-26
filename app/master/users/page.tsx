'use client';
import DashboardLayout from '@/components/DashboardLayout';
import UserManagement from '@/components/UserManagement';
import { MASTER_NAV_ITEMS, ROLES } from '@/lib/roles';

export default function MasterUsersPage() {
  return (
    <DashboardLayout title="Academy User Directory" navItems={MASTER_NAV_ITEMS}>
      <UserManagement currentRole={ROLES.MASTER} />
    </DashboardLayout>
  );
}
