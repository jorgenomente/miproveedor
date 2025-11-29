import { ThemeProvider } from './components/ThemeContext';
import Header from './components/Header';
import Hero from './components/Hero';
import HeroTransition from './components/HeroTransition';
import BeforeAfter from './components/BeforeAfter';
import WhatIs from './components/WhatIs';
import Benefits from './components/Benefits';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Header />
        <Hero />
        <HeroTransition />
        <BeforeAfter />
        <WhatIs />
        <Benefits />
        <HowItWorks />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
