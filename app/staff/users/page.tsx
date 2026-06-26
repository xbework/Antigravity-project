'use client';
import DashboardLayout from '@/components/DashboardLayout';
import UserManagement from '@/components/UserManagement';
import { STAFF_NAV_ITEMS, ROLES } from '@/lib/roles';

export default function StaffUsersPage() {
  return (
    <DashboardLayout title="Staff Directory" navItems={STAFF_NAV_ITEMS}>
      <UserManagement currentRole={ROLES.STAFF} />
    </DashboardLayout>
  );
}
