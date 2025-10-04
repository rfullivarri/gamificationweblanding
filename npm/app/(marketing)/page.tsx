import { CTA } from "@/components/CTA";
import { Container } from "@/components/Container";
import { FeatureCard } from "@/components/FeatureCard";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { IntegrationGrid } from "@/components/IntegrationGrid";
import { Navbar } from "@/components/Navbar";
import { Pricing } from "@/components/Pricing";
import { SectionTitle } from "@/components/SectionTitle";
import { Steps } from "@/components/Steps";
import { Testimonials } from "@/components/Testimonials";
import { BarChart3, Gift, Sparkles } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />

        <SectionTitle
          id="beneficios"
          eyebrow="Beneficios clave"
          title="Diseñado para que tu producto sea irresistible"
          description="Todo lo que necesitas para incrementar la participación y fidelidad en experiencias digitales B2B y B2C."
        >
          <div className="grid gap-6 text-left lg:grid-cols-3">
            <FeatureCard
              icon={Sparkles}
              title="Campañas dinámicas"
              description="Activa misiones recurrentes, eventos estacionales y recompensas sorpresa basadas en el comportamiento del usuario."
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics accionable"
              description="Conecta tus métricas con BigQuery, Snowflake o tu warehouse favorito y monitorea cohortes en tiempo real."
            />
            <FeatureCard
              icon={Gift}
              title="Economía de recompensas"
              description="Configura catálogos con puntos, NFTs o beneficios físicos y automatiza la entrega a través de webhooks."
            />
          </div>
        </SectionTitle>

        <SectionTitle
          id="caracteristicas"
          eyebrow="Integraciones"
          title="Conecta con tu stack en minutos"
          description="Más de treinta conectores oficiales y soporte para webhooks para construir experiencias omnicanal."
        >
          <IntegrationGrid />
        </SectionTitle>

        <SectionTitle
          id="casos"
          eyebrow="Workflow"
          title="Cómo funciona"
          description="Desde la ideación hasta la optimización continua, nuestra plataforma acompaña a tu equipo en cada paso."
        >
          <Container className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6 text-left text-white/70">
              <p>
                Crea segmentos de usuarios según su nivel de engagement, define objetivos y activa automatizaciones sin código.
                Cuando necesites personalizar, usa nuestro SDK y API GraphQL para tener control absoluto.
              </p>
              <p>
                Las campañas se sincronizan automáticamente con tus herramientas favoritas para que cada usuario reciba el
                mensaje correcto en el momento adecuado.
              </p>
            </div>
            <Steps />
          </Container>
        </SectionTitle>

        <SectionTitle
          eyebrow="Historias reales"
          title="Equipos que convierten usuarios en fans"
          description="Startups, empresas SaaS y comunidades digitales utilizan GamificationOS para elevar sus métricas de retención."
        >
          <Testimonials />
        </SectionTitle>

        <SectionTitle
          eyebrow="Precios"
          title="Planes que escalan contigo"
          description="Comienza gratis y evoluciona a un plan empresarial cuando estés listo."
        >
          <Pricing />
        </SectionTitle>

        <CTA />
      </main>
      <Footer />
    </div>
  );
}
