import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      subscriptionStatus?: 'active' | 'suspended' | 'cancelled';
      lastLoginAt?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    subscriptionStatus?: 'active' | 'suspended' | 'cancelled';
    lastLoginAt?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    subscriptionStatus?: 'active' | 'suspended' | 'cancelled';
    lastLoginAt?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Call our backend API to authenticate
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Authentication failed');
          }

          const data = await response.json();

          if (data.user && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              subscriptionStatus: data.user.subscriptionStatus,
              lastLoginAt: data.user.lastLoginAt,
              accessToken: data.token,
            };
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error instanceof Error ? error.message : 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.subscriptionStatus = user.subscriptionStatus;
        token.lastLoginAt = user.lastLoginAt;
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.subscriptionStatus = token.subscriptionStatus;
      session.user.lastLoginAt = token.lastLoginAt;
      (session as { accessToken?: string }).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};