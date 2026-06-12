import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { AppMockup } from './components/AppMockup'
import { Features } from './components/Features'
import { LiveDemo } from './components/LiveDemo'
import { GoalToQuests } from './components/GoalToQuests'
import { HowItWorks } from './components/HowItWorks'
import { RankLadder } from './components/RankLadder'
import { SocialProof } from './components/SocialProof'
import { Waitlist } from './components/Waitlist'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <AppMockup />
      <Features />
      <LiveDemo />
      <GoalToQuests />
      <HowItWorks />
      <RankLadder />
      <SocialProof />
      <Waitlist />
      <Footer />
    </>
  )
}
