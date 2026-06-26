import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { ROLES, type Role } from '@/lib/roles';
import { readData } from './storage';
import { User, Lead } from './store';
import { authConfig } from './auth.config';

// Simple in-memory logger
const loginLogs: any[] = [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const loginId = credentials?.email as string;
        const password = credentials?.password as string;
        const users = readData<User[]>('users.json', []);
        
        const user = users.find(
          (u) => u.email === loginId && u.password === password
        );
        if (!user) return null;

        // Log login
        const logEntry = { email: user.email, role: user.role, time: new Date().toISOString() };
        loginLogs.push(logEntry);
        console.log('[LOGIN LOG]:', logEntry);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          masterPriority: user.masterPriority,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        // Check if this email is already a registered staff/admin/student
        const users = readData<User[]>('users.json', []);
        const existingUser = users.find(
          (u) => u.email.toLowerCase() === user.email?.toLowerCase()
        );
        if (existingUser) {
          // Redirect to login with error message
          return '/login?error=EmailAlreadyRegistered';
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? ROLES.FREE_TRIAL;
        token.avatar = (user as { avatar?: string }).avatar ?? '';
        token.masterPriority = (user as { masterPriority?: string }).masterPriority;
      }
      
      // Google Auth Logging
      if (account?.provider === 'google' && token.email) {
        const logEntry = { email: token.email, role: ROLES.FREE_TRIAL, provider: 'google', time: new Date().toISOString() };
        loginLogs.push(logEntry);
        console.log('[LOGIN LOG]:', logEntry);
      }

      // Every time the token is updated, check if the student is still 'new'
      if (token.role === ROLES.FREE_TRIAL && token.email) {
        // Use case-insensitive check
        const leads = readData<Lead[]>('leads.json', []);
        const existingLead = leads.find(l => l.email.toLowerCase() === token.email?.toLowerCase());
        token.isNewUser = !existingLead;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: Role }).role = token.role as Role;
        (session.user as { avatar?: string }).avatar = token.avatar as string;
        (session.user as { isNewUser?: boolean }).isNewUser = token.isNewUser as boolean;
        (session.user as { masterPriority?: string }).masterPriority = token.masterPriority as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
