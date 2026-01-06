import NextAuth from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { clientPromise } from '@/lib/mongodb'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import { customAlphabet, nanoid } from 'nanoid'

const RANKS = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.png' },
  { name: 'Contender', points: 100, icon: '/images/ranks/contender.png' },
  { name: 'Gladiator', points: 250, icon: '/images/ranks/gladiator.png' },
  { name: 'Vanguard', points: 500, icon: '/images/ranks/vanguard.png' },
  { name: 'Errorless Legend', points: 1000, icon: '/images/ranks/errorless-legend.png' },
] as const

function getRankForExperience(experience: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (experience >= RANKS[i].points) return RANKS[i]
  }
  return RANKS[0]
}

const zeSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

async function generateUniqueZeTag() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `ze_${zeSuffix()}`
    const exists = await User.exists({ zeTag: candidate })
    if (!exists) return candidate
  }
  return `ze_${customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)()}`
}

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
          }

          // The MongoDB adapter can create users without Mongoose defaults.
          // Ensure required ZE Club fields always exist.
          if (!dbUser.zeClubId) {
            dbUser.zeClubId = `ZE-${nanoid(8)}`
          }
          if (!dbUser.roles || dbUser.roles.length === 0) {
            dbUser.roles = ['user']
          }

          const points = typeof dbUser.points === 'number' ? dbUser.points : 0
          const experience = typeof dbUser.experience === 'number' ? dbUser.experience : points
          dbUser.experience = experience
          dbUser.points = experience

          if (!dbUser.rank || dbUser.rank.length === 0 || !dbUser.rankIcon || dbUser.rankIcon.length === 0) {
            const rankData = getRankForExperience(experience)
            dbUser.rank = dbUser.rank && dbUser.rank.length > 0 ? dbUser.rank : rankData.name
            dbUser.rankIcon = dbUser.rankIcon && dbUser.rankIcon.length > 0 ? dbUser.rankIcon : rankData.icon
          }

          if (!dbUser.zeTag || dbUser.zeTag.length === 0) {
            dbUser.zeTag = await generateUniqueZeTag()
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
          }
          if (!user.zeTag || user.zeTag.length === 0) {
            user.zeTag = await generateUniqueZeTag()
          }
          if (typeof user.points !== 'number') {
            user.points = 100
          }
          if (typeof user.experience !== 'number') {
            user.experience = 100
          }
          if (!user.rank || user.rank.length === 0) {
            user.rank = 'Rookie'
          }
          if (!user.rankIcon || user.rankIcon.length === 0) {
            user.rankIcon = '/images/ranks/rookie.png'
          }
          if (!user.roles || user.roles.length === 0) {
            user.roles = ['user']
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
