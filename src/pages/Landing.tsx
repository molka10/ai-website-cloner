import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Examples from "@/components/landing/Examples";

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Examples />
      </main>
      <Footer />
    </>
  );
}