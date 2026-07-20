import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import WaitlistSection from "@/components/WaitlistSection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import SplashVideo from "@/components/SplashVideo";

export default function HomePage() {
  return (
    <div 
      className="landing-theme"
      style={{
        backgroundImage: "url('/images/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Global dark overlay to ensure text readability */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(10,15,20,0.4), rgba(10,15,20,0.85))",
          zIndex: 0,
          pointerEvents: "none"
        }}
      />
      
      {/* Content wrapper to stay above the background overlay */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <SplashVideo />
        <Navbar />
        <main>
          <Hero />
          <Problem />
          <Solution />
          <HowItWorks />
          <Features />
          <SocialProof />
          <WaitlistSection />
          <FAQ />
        </main>
        <Footer />
      </div>
    </div>
  );
}
