import NextAuth from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { clientPromise } from '@/lib/mongodb'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import { nanoid } from 'nanoid'

// @ts-ignore - Type mismatch between NextAuth v5 beta and adapter versions
const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-ignore - MongoDBAdapter type compatibility
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // @ts-ignore - Provider type compatibility
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
    // @ts-ignore - Provider type compatibility
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/join-us',
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Redirect to ze-club after sign in
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to ze-club
      return `${baseUrl}/ze-club`
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.roles = (token.roles as string)?.split(',') || ['user']
        session.user.points = token.points as number
        session.user.rank = token.rank as string
        session.user.zeClubId = token.zeClubId as string
        session.user.zeTag = token.zeTag as string | undefined
        session.user.profilePhotoUrl = token.profilePhotoUrl as string | undefined
      }
      return session
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        await dbConnect()
        const dbUser = await User.findOne({ email: user.email })
        if (dbUser) {
          // Update provider ID if not set
          if (!dbUser.discordId && account?.provider === 'discord') {
            dbUser.discordId = account.providerAccountId
            await dbUser.save()
          }
          // Initialize ZE Club data if new user
          if (!dbUser.zeClubId) {
            dbUser.zeClubId = `ZE-${nanoid(8)}`
            dbUser.points = 100
            dbUser.rank = 'Rookie'
            dbUser.roles = ['user']
            // Initialize default zeTag
            dbUser.zeTag = `ZE_${nanoid(8)}`
            await dbUser.save()
          }
          // Update last login
          dbUser.lastLoginAt = new Date()
          await dbUser.save()
          
          token.id = dbUser._id.toString()
          token.roles = dbUser.roles.join(',') // Convert array to string
          token.points = dbUser.points
          token.rank = dbUser.rank
          token.zeClubId = dbUser.zeClubId
          token.zeTag = dbUser.zeTag
          token.profilePhotoUrl = dbUser.profilePhotoUrl
        }
      } else if (trigger === 'update' || !token.profilePhotoUrl) {
        // Refresh profile photo URL from database on token update or if missing
        await dbConnect()
        const dbUser = await User.findById(token.id)
        if (dbUser) {
          token.profilePhotoUrl = dbUser.profilePhotoUrl
          token.points = dbUser.points
          token.rank = dbUser.rank
          token.zeTag = dbUser.zeTag
        }
      }
      return token
    },
  },
  events: {
    async signIn(message) {
      if (message.isNewUser) {
        await dbConnect()
        const user = await User.findOne({ email: message.user.email })
        if (user) {
          // Set provider ID
          if (message.account?.provider === 'discord') {
            user.discordId = message.account.providerAccountId
          }
          // Initialize ZE Club data for new users
          if (!user.zeClubId) {
            user.zeClubId = `ZE-${nanoid(8)}`
            user.points = 100
            user.rank = 'Rookie'
            user.roles = ['user']
            user.zeTag = `ZE_${nanoid(8)}`
          }
          user.lastLoginAt = new Date()
          await user.save()
        }
      }
    },
  },
})

export { auth, signIn, signOut }
export const { GET, POST } = handlers
