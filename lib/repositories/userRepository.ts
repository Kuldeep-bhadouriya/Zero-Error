import User from '@/models/user'

export async function findUserById(userId: string) {
  return User.findById(userId)
}

export async function findUserByEmail(email: string) {
  return User.findOne({ email })
}

export async function countUsersWithHigherExperience(experience: number) {
  return User.countDocuments({ experience: { $gt: experience } })
}

export async function saveUser(user: any) {
  await user.save()
  return user
}

export async function updateUserFields(userId: string, fields: Record<string, unknown>) {
  return User.findByIdAndUpdate(userId, { $set: fields }, { new: true })
}
