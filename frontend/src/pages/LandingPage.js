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
      title: 'Video Lessons',
      description: 'Learn from high-quality video content from YouTube and Vimeo'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Rich Content',
      description: 'Access rich text lessons and downloadable resources'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Track Progress',
      description: 'Monitor your learning journey with progress tracking'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Quizzes',
      description: 'Test your knowledge with interactive quizzes'
    }
  ];

  const stats = [
    { value: '500+', label: 'Active Learners' },
    { value: '50+', label: 'Expert Instructors' },
    { value: '200+', label: 'Courses' },
    { value: '95%', label: 'Completion Rate' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-xl font-heading font-bold">Lumina</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-courses">
                Courses
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-dashboard">
                    Dashboard
                  </Link>
                  <Link to="/profile" data-testid="nav-profile">
                    <Button variant="outline" size="sm">
                      {user?.full_name || 'Profile'}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" data-testid="nav-login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/register" data-testid="nav-register">
                    <Button size="sm" className="glow-primary">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
                <span className="text-primary text-sm font-medium">New courses every week</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-tight">
                Learn Without{' '}
                <span className="gradient-text">Limits</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Unlock your potential with expert-led courses. From coding to design, 
                master new skills at your own pace with our comprehensive learning platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={isAuthenticated ? "/courses" : "/register"} data-testid="hero-cta">
                  <Button size="lg" className="glow-primary group">
                    {isAuthenticated ? "Browse Courses" : "Start Learning Free"}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/courses" data-testid="hero-explore">
                  <Button size="lg" variant="outline">
                    <Play className="mr-2 w-4 h-4" />
                    Explore Catalog
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
                  alt="Learning illustration"
                  className="rounded-2xl w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-2xl" />
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 glass-card p-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">500+</p>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
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

      {/* Features Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools and features you need for an effective learning experience.
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

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-background to-card">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of learners who are already transforming their careers with Lumina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? "/courses" : "/register"} data-testid="cta-button">
                <Button size="lg" className="glow-primary">
                  {isAuthenticated ? "Explore Courses" : "Get Started for Free"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <span className="font-heading font-bold">Lumina LMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Lumina LMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
