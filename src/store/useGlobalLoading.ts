import { create } from "zustand"

interface GlobalLoadingState {
  isLoading: boolean
  message?: string
  showLoading: (message?: string) => void
  hideLoading: () => void
}

export const useGlobalLoading = create<GlobalLoadingState>((set) => ({
  isLoading: false,
  message: undefined,
  showLoading: (message) => set({ isLoading: true, message }),
  hideLoading: () => set({ isLoading: false, message: undefined }),
}))
