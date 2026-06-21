import Hero from './components/Hero'
import WalletScene from './components/WalletScene'
import SendScene from './components/SendScene'
import SplitScene from './components/SplitScene'

function App() {
  return (
    <>
      <div className="grain-overlay" />
      <Hero />
      <WalletScene />
      <SendScene />
      <SplitScene />
    </>
  )
}

export default App