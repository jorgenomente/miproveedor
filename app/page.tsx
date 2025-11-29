"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/landing/ThemeContext";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HeroTransition from "@/components/landing/HeroTransition";
import BeforeAfter from "@/components/landing/BeforeAfter";
import WhatIs from "@/components/landing/WhatIs";
import Benefits from "@/components/landing/Benefits";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import { useThemeTokens } from "@/lib/landing/useThemeTokens";
import "./landing.css";

function LandingContent() {
  const { tokens } = useThemeTokens();

  return (
    <div className="min-h-screen" style={{ background: tokens.backgrounds.primary }}>
      <Header />
      <Hero />
      <HeroTransition />
      <BeforeAfter />
      <WhatIs />
      <Benefits />
      <HowItWorks />
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => {
      document.body.classList.remove("landing-page");
    };
  }, []);

  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
}
