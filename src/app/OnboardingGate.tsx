import { useState, type ReactNode } from 'react'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ONBOARDING_KEY } from '../storage/storageKeys'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const [complete, setComplete] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'true'
    } catch {
      return true
    }
  })

  if (!complete) {
    return (
      <OnboardingPage
        onStart={() => {
          try {
            localStorage.setItem(ONBOARDING_KEY, 'true')
          } catch {
            // AppDataProvider will surface unavailable storage as a recovery state.
          }
          setComplete(true)
        }}
      />
    )
  }

  return children
}
