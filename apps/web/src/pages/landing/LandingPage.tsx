import { SitePage } from '../../components/site/SitePage';
import { AboutSection } from './AboutSection';
import { AudiencesSection } from './AudiencesSection';
import { BrandCarousel } from './BrandCarousel';
import { HeroSection } from './HeroSection';
import { ServicesSection } from './ServicesSection';

export function LandingPage() {
  return (
    <SitePage>
      <HeroSection />
      <BrandCarousel />
      <ServicesSection />
      <AudiencesSection />
      <AboutSection />
    </SitePage>
  );
}
