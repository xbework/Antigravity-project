'use client';
import DashboardLayout from '@/components/DashboardLayout';
import UserManagement from '@/components/UserManagement';
import { ADMIN_NAV_ITEMS, ROLES } from '@/lib/roles';

export default function AdminUsersPage() {
  return (
    <DashboardLayout title="Universal User Registry" navItems={ADMIN_NAV_ITEMS}>
      <UserManagement currentRole={ROLES.ADMIN} />
    </DashboardLayout>
  );
}
