interface OnboardingPageProps {
  onStart: () => void
}

export function OnboardingPage({ onStart }: OnboardingPageProps) {
  return (
    <main className="onboarding">
      <div className="onboarding__stamp" aria-hidden="true">MF · 01</div>
      <div className="onboarding__copy">
        <p className="eyebrow">A YEAR, COLLECTED</p>
        <h1>My Firsts</h1>
        <p className="onboarding__lead">这一年，有哪些事情是你第一次经历？</p>
        <p className="onboarding__note">收藏那些以后回想起来，会记得的第一次。</p>
        <button className="button button--ink" type="button" onClick={onStart}>开始记录</button>
      </div>
      <p className="onboarding__edition">PRIVATE EDITION<br />EST. THIS YEAR</p>
    </main>
  )
}
