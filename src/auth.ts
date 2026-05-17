import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import Apple from "next-auth/providers/apple"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"
import { getAppleClientSecret } from "@/lib/apple-client-secret"
import { verifyAppleIdentityToken } from "@/lib/apple-verify"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_PRIVATE_KEY
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: getAppleClientSecret(),
          }),
        ]
      : []),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "apple-native",
      name: "Apple Native",
      credentials: {
        identityToken: { label: "identityToken", type: "text" },
        name: { label: "name", type: "text" },
      },
      async authorize(credentials) {
        const identityToken = credentials?.identityToken as string | undefined;
        if (!identityToken) return null;

        const audience = process.env.APPLE_NATIVE_BUNDLE_ID || "jp.boatbank.app";
        const payload = await verifyAppleIdentityToken(identityToken, audience);

        const appleSub = payload.sub;
        const email = payload.email?.toLowerCase();
        const displayName = (credentials?.name as string | undefined) || undefined;

        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "apple",
              providerAccountId: appleSub,
            },
          },
          include: { user: true },
        });

        if (existingAccount) {
          return {
            id: existingAccount.user.id,
            name: existingAccount.user.name,
            email: existingAccount.user.email,
            role: existingAccount.user.role,
          };
        }

        let user = email
          ? await prisma.user.findUnique({ where: { email } })
          : null;

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: email ?? null,
              name: displayName ?? null,
              emailVerified: new Date(),
            },
          });
        }

        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: "apple",
            providerAccountId: appleSub,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase();

const ip = await getClientIp();
        const emailLimit = await rateLimit(`login:email:${email}`, 10, 5 * 60 * 1000);
        const ipLimit = await rateLimit(`login:ip:${ip}`, 30, 5 * 60 * 1000);
        if (!emailLimit.allowed || !ipLimit.allowed) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({
          where: { email: email }
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password!
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      // 5分以上経過した JWT は DB から role を再取得（権限変更を反映）
      const now = Math.floor(Date.now() / 1000);
      const lastFetch = (token.roleFetchedAt as number | undefined) ?? 0;
      const REFRESH_INTERVAL = 5 * 60; // 5分
      if (token.id && (trigger === "update" || now - lastFetch > REFRESH_INTERVAL)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.roleFetchedAt = now;
          } else {
            // ユーザーが削除されていれば JWT を無効化
            return null;
          }
        } catch (e) {
          console.error("[auth.jwt] role refresh failed", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  pages: {
    signIn: "/login",
  }
})

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      bio?: string
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    role?: string
    bio?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    role?: string
  }
}
