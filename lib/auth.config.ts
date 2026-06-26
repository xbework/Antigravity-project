import type { NextAuthConfig } from 'next-auth';
import { ROLES, type Role } from '@/lib/roles';

export const authConfig = {
  providers: [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? ROLES.FREE_TRIAL;
        token.avatar = (user as { avatar?: string }).avatar ?? '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: Role }).role = token.role as Role;
        (session.user as { avatar?: string }).avatar = token.avatar as string;
        (session.user as { isNewUser?: boolean }).isNewUser = token.isNewUser as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
