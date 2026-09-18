import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected render failure', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="placeholder-page">
          <p className="eyebrow">MY FIRSTS</p>
          <h1>Something went wrong</h1>
          <p>Your saved Firsts have not been changed. Reload the page to try again.</p>
        </main>
      )
    }

    return this.props.children
  }
}
