import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Clock,
  ChevronRight,
  Play,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  const { api, user, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const enrollmentsRes = await api.get('/enrollments');
      setEnrollments(enrollmentsRes.data);
      
      const coursesRes = await api.get('/courses?limit=6');
      const enrolledIds = enrollmentsRes.data.map(e => e.course_id);
      setRecommendedCourses(
        coursesRes.data.filter(c => !enrolledIds.includes(c.id)).slice(0, 4)
      );
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const inProgress = enrollments.filter(e => !e.is_completed);
  const completed = enrollments.filter(e => e.is_completed);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Barra Lateral */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-xl font-heading font-bold">Lumina</span>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link
              to="/student"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary"
              data-testid="nav-dashboard"
            >
              <BookOpen className="w-5 h-5" />
              Panel
            </Link>
            <Link
              to="/courses"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              data-testid="nav-courses"
            >
              <Play className="w-5 h-5" />
              Explorar Cursos
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              data-testid="nav-profile"
            >
              <User className="w-5 h-5" />
              Perfil
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Usuario')}&background=6366f1&color=fff`}
              alt={user?.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.full_name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role === 'student' ? 'Estudiante' : user?.role === 'instructor' ? 'Instructor' : 'Admin'}
              </p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2">
              ¡Bienvenido, {user?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">Continúa tu viaje de aprendizaje</p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgress.length}</p>
                  <p className="text-sm text-muted-foreground">En Progreso</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completed.length}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Cursos</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Continuar Aprendiendo */}
          {inProgress.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-semibold">Continuar Aprendiendo</h2>
                <Link to="/courses" className="text-primary text-sm hover:underline">
                  Explorar más →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inProgress.slice(0, 4).map((enrollment, index) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="glass-card p-4 flex gap-4 hover:border-primary/30 transition-colors group"
                      data-testid={`enrollment-${enrollment.id}`}
                    >
                      <img
                        src={enrollment.course?.cover_image || 'https://images.unsplash.com/photo-1513746199652-7a5904642685?w=200'}
                        alt={enrollment.course?.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate group-hover:text-primary transition-colors">
                          {enrollment.course?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {enrollment.completed_lessons} de {enrollment.total_lessons} lecciones
                        </p>
                        <div className="space-y-1">
                          <Progress value={enrollment.progress_percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(enrollment.progress_percentage)}% completado
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors self-center" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Cursos Completados */}
          {completed.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-heading font-semibold mb-6">Cursos Completados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map((enrollment, index) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="glass-card p-4 hover:border-accent/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{enrollment.course?.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            Completado el {new Date(enrollment.completed_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Cursos Recomendados */}
          {recommendedCourses.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-semibold">Recomendados para Ti</h2>
                <Link to="/courses" className="text-primary text-sm hover:underline">
                  Ver todos →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/courses/${course.id}`}
                      className="glass-card group hover:border-primary/30 transition-colors"
                    >
                      <div className="aspect-video relative overflow-hidden rounded-t-xl">
                        <img
                          src={course.cover_image || 'https://images.unsplash.com/photo-1513746199652-7a5904642685?w=400'}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!course.is_free && (
                          <Badge className="absolute top-2 right-2 bg-primary">${course.price}</Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.lessons_count} lecciones
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Estado Vacío */}
          {enrollments.length === 0 && !loading && (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aún no tienes cursos</h3>
              <p className="text-muted-foreground mb-6">
                Comienza tu viaje de aprendizaje inscribiéndote en un curso
              </p>
              <Link to="/courses">
                <Button className="glow-primary">Explorar Cursos</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
