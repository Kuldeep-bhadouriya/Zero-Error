'use client'

import { create } from 'zustand'

type ZeClubDashboardSnapshot = {
  zeTag?: string
  zeCoins?: number
  totalPoints?: number
}

type ZeClubStoreState = {
  zeTag?: string
  zeCoins: number
  totalPoints: number
  hydrateFromDashboard: (snapshot: ZeClubDashboardSnapshot) => void
  setZeCoins: (coins: number) => void
}

function resolveCoins(snapshot: ZeClubDashboardSnapshot) {
  if (typeof snapshot.zeCoins === 'number') {
    return snapshot.zeCoins
  }

  return typeof snapshot.totalPoints === 'number' ? snapshot.totalPoints : 0
}

export const useZeClubStore = create<ZeClubStoreState>((set) => ({
  zeTag: undefined,
  zeCoins: 0,
  totalPoints: 0,
  hydrateFromDashboard: (snapshot) => {
    const coins = resolveCoins(snapshot)

    set({
      zeTag: snapshot.zeTag,
      zeCoins: coins,
      totalPoints: typeof snapshot.totalPoints === 'number' ? snapshot.totalPoints : coins,
    })
  },
  setZeCoins: (coins) => {
    set({ zeCoins: coins })
  },
}))
