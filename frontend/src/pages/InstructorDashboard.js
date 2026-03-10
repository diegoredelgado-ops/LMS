import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  GraduationCap, 
  Plus, 
  BookOpen, 
  Users, 
  DollarSign,
  BarChart3,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { AIGenerateCourseModal } from '../components/AIGenerateModals';

const InstructorDashboard = () => {
  const { api, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [coursesRes, statsRes] = await Promise.all([
        api.get('/instructor/courses'),
        api.get('/instructor/stats')
      ]);
      
      setCourses(coursesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    navigate('/courses/new/edit');
  };

  const handlePublishToggle = async (courseId, currentStatus) => {
    try {
      await api.put(`/courses/${courseId}`, { is_published: !currentStatus });
      toast.success(currentStatus ? 'Curso despublicado' : '¡Curso publicado!');
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar el curso');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/courses/${deleteId}`);
      toast.success('Curso eliminado');
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar el curso');
    }
  };

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
              to="/instructor"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary"
              data-testid="nav-dashboard"
            >
              <BarChart3 className="w-5 h-5" />
              Panel
            </Link>
            <Link
              to="/courses"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              data-testid="nav-courses"
            >
              <BookOpen className="w-5 h-5" />
              Explorar Cursos
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                data-testid="nav-admin"
              >
                <Users className="w-5 h-5" />
                Panel Admin
              </Link>
            )}
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
                {user?.role === 'instructor' ? 'Instructor' : 'Admin'}
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">Panel del Instructor</h1>
              <p className="text-muted-foreground">Administra tus cursos y revisa el rendimiento</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowAIModal(true)} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" data-testid="ai-generate-course-btn">
                <Sparkles className="w-4 h-4 mr-2" />
                Generar con IA
              </Button>
              <Button onClick={handleCreateCourse} className="glow-primary" data-testid="create-course-btn">
                <Plus className="w-4 h-4 mr-2" />
                Crear Curso
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <p className="text-2xl font-bold">{stats.total_courses}</p>
                    <p className="text-sm text-muted-foreground">Total Cursos</p>
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
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_students}</p>
                    <p className="text-sm text-muted-foreground">Total Estudiantes</p>
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
                    <BarChart3 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.avg_progress}%</p>
                    <p className="text-sm text-muted-foreground">Progreso Prom.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${stats.total_revenue}</p>
                    <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Lista de Cursos */}
          <section>
            <h2 className="text-xl font-heading font-semibold mb-6">Tus Cursos</h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass-card p-6 animate-pulse">
                    <div className="flex gap-6">
                      <div className="w-48 h-28 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aún no tienes cursos</h3>
                <p className="text-muted-foreground mb-6">
                  Crea tu primer curso y comienza a enseñar
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setShowAIModal(true)} variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar con IA
                  </Button>
                  <Button onClick={handleCreateCourse} className="glow-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Curso
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <img
                        src={course.cover_image || 'https://images.unsplash.com/photo-1513746199652-7a5904642685?w=400'}
                        alt={course.title}
                        className="w-full md:w-48 h-28 rounded-lg object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{course.title}</h3>
                              <Badge variant={course.is_published ? 'default' : 'secondary'}>
                                {course.is_published ? 'Publicado' : 'Borrador'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {course.description || 'Sin descripción'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.lessons_count} lecciones
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.students_count} estudiantes
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {course.is_free ? 'Gratis' : `$${course.price}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Link to={`/courses/${course.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`edit-course-${course.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublishToggle(course.id, course.is_published)}
                          data-testid={`publish-course-${course.id}`}
                        >
                          {course.is_published ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Despublicar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Publicar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setDeleteId(course.id)}
                          data-testid={`delete-course-${course.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Curso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.
              Todas las lecciones, inscripciones y datos de progreso serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Generación de Curso con IA */}
      {showAIModal && (
        <AIGenerateCourseModal
          onClose={() => setShowAIModal(false)}
          onCourseCreated={(courseId) => {
            setShowAIModal(false);
            navigate(`/courses/${courseId}/edit`);
          }}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;
