import { AppRouter } from './router'
import { OnboardingGate } from './OnboardingGate'
import { AppDataProvider } from '../hooks/useAppData'
import { ToastProvider } from '../hooks/useToast'
import { ToastRegion } from '../components/ToastRegion'

export function App() {
  return (
    <OnboardingGate>
      <AppDataProvider>
        <ToastProvider>
          <AppRouter />
          <ToastRegion />
        </ToastProvider>
      </AppDataProvider>
    </OnboardingGate>
  )
}
