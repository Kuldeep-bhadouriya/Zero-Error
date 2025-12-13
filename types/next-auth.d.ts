import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles: string[]
      points: number
      rank: string
      zeClubId: string
      zeTag?: string
      profilePhotoUrl?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    roles: string[]
    points: number
    rank: string
    zeClubId: string
    zeTag?: string
    profilePhotoUrl?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roles: string[]
    points: number
    rank: string
    zeClubId: string
    zeTag?: string
    profilePhotoUrl?: string
  }
}
