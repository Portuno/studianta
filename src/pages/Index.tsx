import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Wrench,
  FileText,
  CheckCircle2
} from 'lucide-react'

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <Card className="p-6 h-full">
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-foreground/80 mt-1">{description}</p>
      </div>
    </div>
  </Card>
)

const StepCard = ({ index, title, description }: { index: number; title: string; description: string }) => (
  <Card className="p-6 h-full">
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {index}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-foreground/80 mt-1">{description}</p>
      </div>
    </div>
  </Card>
)


const PriceCard = ({ plan, price, features, highlighted = false }: { plan: string; price: string; features: string[]; highlighted?: boolean }) => (
  <Card className={`p-6 h-full flex flex-col ${highlighted ? 'border-primary shadow-lg' : ''}`}>
    <h3 className="text-xl font-semibold">{plan}</h3>
    <p className="mt-2 text-3xl font-bold">{price}</p>
    <ul className="mt-4 space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" aria-hidden="true" />
          <span className="text-muted-foreground">{f}</span>
        </li>
      ))}
    </ul>
    <Button asChild className="mt-6" variant={highlighted ? 'default' : 'outline'} aria-label={`Elegir plan ${plan}`}>
      <Link to="/login" tabIndex={0}>Empieza Gratis</Link>
    </Button>
  </Card>
)

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="px-6 sm:px-10 md:px-16 lg:px-24 pt-16 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-6">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Tu Asistente de Estudio Personalizado</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Estudia Menos, Aprende Más. La IA Hace el Trabajo Pesado.
          </h1>
          <p className="mt-4 text-lg text-foreground/90">
            Organiza tus apuntes, crea planes de estudio y domina cualquier materia con la ayuda de la inteligencia artificial.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" aria-label="Empieza Gratis">
              <Link to="/login" tabIndex={0}>Empieza Gratis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" aria-label="Pruébalo Ahora">
              <Link to="/login" tabIndex={0}>Pruébalo Ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="px-6 sm:px-10 md:px-16 lg:px-24 py-12 bg-muted/20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">¿Te sientes abrumado por tus estudios?</h2>
            <ul className="mt-4 space-y-2">
              <li className="text-foreground/80">Demasiadas notas, poco tiempo.</li>
              <li className="text-foreground/80">Estudiar de forma desorganizada te hace perder el tiempo.</li>
            </ul>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Descubre una forma más inteligente de aprender</h3>
            <p className="text-sm text-foreground/80 mt-2">
              Nuestra IA transforma tus apuntes en conocimiento.
            </p>
            <Button asChild className="mt-4" aria-label="Comenzar">
              <Link to="/login" tabIndex={0}>Comenzar</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-6 sm:px-10 md:px-16 lg:px-24 py-16 bg-muted">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground">Una Solución Completa para tu Vida Académica.</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={FileText} title="Generador Contextual" description="Sube cualquier archivo y la IA crea resúmenes, quizzes y más." />
            <FeatureCard icon={Calendar} title="Planificador Inteligente" description="Planes dinámicos que se adaptan a tus fechas de examen." />
            <FeatureCard icon={MessageSquare} title="Chat AI" description="Haz preguntas sobre tus apuntes a tu asistente personal." />
            <FeatureCard icon={Wrench} title="Herramientas Académicas" description="Generador de exámenes, traductor y más utilidades." />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 sm:px-10 md:px-16 lg:px-24 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground">¿Cómo Funciona?</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StepCard index={1} title="Sube tus Apuntes" description="Sube tus notas o el programa de tu materia." />
            <StepCard index={2} title="La IA Hace la Magia" description="Procesamos tus archivos y creamos material didáctico." />
            <StepCard index={3} title="Domina tu Materia" description="Estudia con un plan claro y un asistente que te guía." />
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section className="px-6 sm:px-10 md:px-16 lg:px-24 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground">Elige el plan perfecto para ti.</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <PriceCard
              plan="Free"
              price="$0"
              features={[
                'Resúmenes básicos',
                'Chat limitado',
                'Carga de archivos ligera'
              ]}
            />
            <PriceCard
              plan="Basic"
              price="$9/mes"
              highlighted
              features={[
                'Todo lo de Free',
                'Planificador inteligente',
                'Más capacidad de archivos'
              ]}
            />
            <PriceCard
              plan="Pro"
              price="$19/mes"
              features={[
                'Todo lo de Basic',
                'Herramientas avanzadas',
                'Soporte prioritario'
              ]}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 sm:px-10 md:px-16 lg:px-24 py-16 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Empieza a aprender de forma más inteligente hoy.</h2>
          <p className="mt-2 text-primary-foreground/90">Únete a miles de estudiantes que están transformando su forma de estudiar.</p>
          <Button asChild size="lg" className="mt-6" aria-label="Crea tu Cuenta Gratis">
            <Link to="/login" tabIndex={0}>Crea tu Cuenta Gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Index
