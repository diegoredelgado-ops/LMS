import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  GraduationCap, 
  Play, 
  Users, 
  Trophy, 
  ArrowRight,
  BookOpen,
  Video,
  FileText,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Lecciones en Video',
      description: 'Aprende con contenido de alta calidad de YouTube y Vimeo'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Contenido Rico',
      description: 'Accede a lecciones de texto enriquecido y recursos descargables'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Seguimiento de Progreso',
      description: 'Monitorea tu avance de aprendizaje con seguimiento detallado'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Quizzes',
      description: 'Evalúa tu conocimiento con quizzes interactivos'
    }
  ];

  const stats = [
    { value: '500+', label: 'Estudiantes Activos' },
    { value: '50+', label: 'Instructores Expertos' },
    { value: '200+', label: 'Cursos' },
    { value: '95%', label: 'Tasa de Completación' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navegación */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-xl font-heading font-bold">Lumina</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-courses">
                Cursos
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-dashboard">
                    Panel
                  </Link>
                  <Link to="/profile" data-testid="nav-profile">
                    <Button variant="outline" size="sm">
                      {user?.full_name || 'Perfil'}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" data-testid="nav-login">
                    <Button variant="ghost" size="sm">Iniciar Sesión</Button>
                  </Link>
                  <Link to="/register" data-testid="nav-register">
                    <Button size="sm" className="glow-primary">Comenzar</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sección Hero */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-primary text-sm font-medium">Nuevos cursos cada semana</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-tight">
                Aprende Sin{' '}
                <span className="gradient-text">Límites</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Desbloquea tu potencial con cursos dirigidos por expertos. Desde programación hasta diseño, 
                domina nuevas habilidades a tu propio ritmo con nuestra plataforma de aprendizaje integral.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={isAuthenticated ? "/courses" : "/register"} data-testid="hero-cta">
                  <Button size="lg" className="glow-primary group">
                    {isAuthenticated ? "Explorar Cursos" : "Comienza Gratis"}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/courses" data-testid="hero-explore">
                  <Button size="lg" variant="outline">
                    <Play className="mr-2 w-4 h-4" />
                    Ver Catálogo
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1758117169154-ba6ffd8f51ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMDNkJTIwZ2VvbWV0cmljJTIwc2hhcGVzJTIwZmxvYXRpbmclMjBkYXJrJTIwYmFja2dyb3VuZCUyMGJsdWUlMjBwdXJwbGUlMjBsaWdodHxlbnwwfHx8fDE3NzMwOTA3OTh8MA&ixlib=rb-4.1.0&q=85&w=800"
                  alt="Ilustración de aprendizaje"
                  className="rounded-2xl w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-2xl" />
              </div>
              
              {/* Tarjeta Flotante */}
              <div className="absolute -bottom-6 -left-6 glass-card p-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">500+</p>
                    <p className="text-sm text-muted-foreground">Estudiantes Activos</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sección Estadísticas */}
      <section className="py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-heading font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Características */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-4">
              Todo lo que Necesitas para{' '}
              <span className="gradient-text">Triunfar</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestra plataforma proporciona todas las herramientas y características que necesitas para una experiencia de aprendizaje efectiva.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="glass-card p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="text-primary">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección CTA */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-background to-card">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
              ¿Listo para Comenzar tu Viaje de Aprendizaje?
            </h2>
            <p className="text-lg text-muted-foreground">
              Únete a miles de estudiantes que ya están transformando sus carreras con Lumina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? "/courses" : "/register"} data-testid="cta-button">
                <Button size="lg" className="glow-primary">
                  {isAuthenticated ? "Explorar Cursos" : "Comienza Gratis"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pie de Página */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <span className="font-heading font-bold">Lumina LMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Lumina LMS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
