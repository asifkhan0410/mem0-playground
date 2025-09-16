import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import db from './database';
import { v4 as uuidv4 } from 'uuid';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : undefined,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      
      // Check if user exists
      const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(user.email) as any;
      
      if (!existingUser) {
        // Create new user
        const userId = uuidv4();
        db.prepare(`
          INSERT INTO users (id, email, name, image)
          VALUES (?, ?, ?, ?)
        `).run(userId, user.email, user.name || null, user.image || null);
        
        user.id = userId;
      } else {
        user.id = existingUser.id;
      }
      
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get(session.user.email) as any;
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};