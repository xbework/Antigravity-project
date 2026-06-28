export const ROLES = {
  ADMIN: 'admin',
  MASTER: 'master',
  STAFF: 'staff',
  STUDENT: 'student',
  FREE_TRIAL: 'free_trial',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const MASTER_CATEGORIES = ['A1', 'B1', 'C1'] as const;
export type MasterCategory = (typeof MASTER_CATEGORIES)[number];

export function getRoleRedirect(role: Role): string {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.MASTER:
      return '/master/dashboard';
    case ROLES.STAFF:
      return '/staff/dashboard';
    case ROLES.STUDENT:
      return '/student/dashboard';
    case ROLES.FREE_TRIAL:
      return '/freetrial';
    default:
      return '/';
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  master: 'Master',
  staff: 'Staff',
  student: 'Student',
  free_trial: 'Free Trial',
};

export const ADMIN_NAV_ITEMS = [
  { icon: '📊', label: 'Overview', href: '/admin/dashboard' },
  { 
    icon: '👥', 
    label: 'Users', 
    href: '/admin/users', 
    subItems: [
      { label: 'Masters', href: '/admin/users/masters' },
      { label: 'Staffs', href: '/admin/users/staffs' },
      { label: 'Students', href: '/admin/users/students' },
    ]
  },
  { icon: '🎯', label: 'Leads', href: '/admin/leads' },
  { icon: '👨‍🎓', label: 'Students', href: '/admin/users/students' },
  { icon: '👥', label: 'Staff', href: '/admin/users/staffs' },
  { icon: '🎓', label: 'Structure', href: '/admin/courses' },
  { icon: '💰', label: 'Revenue', href: '/admin/revenue' },
  { icon: '⚙️', label: 'Academy Settings', href: '/admin/settings' },
];

export const MASTER_NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', href: '/master/dashboard' },
  { 
    icon: '👥', 
    label: 'Users', 
    href: '/master/users',
  },
  { icon: '🎯', label: 'Leads', href: '/master/leads' },
  { icon: '🎓', label: 'Structure', href: '/master/courses' },
  { icon: '📝', label: 'Attendance', href: '/master/attendance' },
  { icon: '📅', label: 'Schedule', href: '/master/schedule' },
];

export const STAFF_NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', href: '/staff/dashboard' },
  { 
    icon: '📚', 
    label: 'Academics', 
    href: '/academics',
    subItems: [
      { label: 'Schedule Classes', href: '/academics/schedule' },
      { label: 'Mark Attendance', href: '/academics/attendance' }
    ]
  },
  { icon: '📝', label: 'My Attendance', href: '/staff/attendance' },
  { icon: '🎓', label: 'My Classes', href: '/staff/classes' },
];
