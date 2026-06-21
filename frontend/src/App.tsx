import Hero from './components/Hero'
import WalletScene from './components/WalletScene'
import SendScene from './components/SendScene'
import SplitScene from './components/SplitScene'
import TrustScene from './components/TrustScene'

function App() {
  return (
    <>
      <div className="grain-overlay" />
      <Hero />
      <WalletScene />
      <SendScene />
      <SplitScene />
      <TrustScene />
    </>
  )
}

export default App