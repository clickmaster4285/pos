import Navbar from './Navbar';
import Hero from './Hero';
import StandOutSection from './StandOut';
import SocialMarketing from './SocialMarketing';
import Analytics from './analytics';
import Testimonials from './Testimonial';
import Playbook from './Playbook';
import PricingPlan from './PricingPlan';
import Blog from './Blogs';
import FAQSection from './Faq';
import Footer from './Footer';
const LandingPage = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <StandOutSection />
      <SocialMarketing />
      <Analytics />
      <Testimonials />
      <Playbook />

      <section id="pricing" className="scroll-mt-24">
        <PricingPlan />
      </section>
      <Blog />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
