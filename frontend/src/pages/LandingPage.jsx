import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Architecture from '../components/Architecture';
import ExampleIncidents from '../components/ExampleIncidents';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function LandingPage({ onNavigate, onSelectExample }) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} />
      <main>
        <Hero onLaunch={() => onNavigate('/analyze')} />
        <HowItWorks />
        <Features />
        <Architecture />
        <ExampleIncidents onSelectExample={onSelectExample} />
        <CTA onLaunch={() => onNavigate('/analyze')} />
      </main>
      <Footer />
    </div>
  );
}
