import { SitePage } from '../../components/site/SitePage';
import { AboutSection } from './AboutSection';
import { AudiencesSection } from './AudiencesSection';
import { HeroSection } from './HeroSection';
import { ServicesSection } from './ServicesSection';

export function LandingPage() {
  return (
    <SitePage>
      <HeroSection />
      <ServicesSection />
      <AudiencesSection />
      <AboutSection />
    </SitePage>
  );
}
