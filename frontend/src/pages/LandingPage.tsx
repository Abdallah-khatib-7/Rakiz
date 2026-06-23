import Hero from '../components/Hero'
import WalletScene from '../components/WalletScene'
import GlobeScene from '../components/GlobeScene'
import SendScene from '../components/SendScene'
import SplitScene from '../components/SplitScene'
import TrustScene from '../components/TrustScene'
import PricingScene from '../components/PricingScene'
import CTAScene from '../components/CTAScene'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <WalletScene />
      <GlobeScene />
      <SendScene />
      <SplitScene />
      <TrustScene />
      <PricingScene />
      <CTAScene />
    </>
  )
}