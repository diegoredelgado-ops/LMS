import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Users, 
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CourseCatalog = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [searchParams]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchParams.get('search')) params.append('search', searchParams.get('search'));
      if (searchParams.get('category')) params.append('category', searchParams.get('category'));
      if (searchParams.get('level')) params.append('level', searchParams.get('level'));
      
      const response = await axios.get(`${API_URL}/api/courses?${params.toString()}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
    if (key === 'category') setCategory(value === 'all' ? '' : value);
    if (key === 'level') setLevel(value === 'all' ? '' : value);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearch('');
    setCategory('');
    setLevel('');
  };

  const hasFilters = search || category || level;

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLevelText = (lvl) => {
    switch (lvl) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return lvl;
    }
  };

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

            <div className="flex items-center gap-4">
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
                    <Button size="sm">Comenzar</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="pt-24 pb-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Explora Nuestros <span className="gradient-text">Cursos</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Navega por nuestra colección de cursos dirigidos por expertos y comienza tu viaje de aprendizaje hoy.
            </p>
          </div>

          {/* Búsqueda y Filtros */}
          <div className="glass-card p-6 mb-8">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Select value={category || 'all'} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger className="w-[160px]" data-testid="category-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={level || 'all'} onValueChange={(v) => handleFilterChange('level', v)}>
                  <SelectTrigger className="w-[160px]" data-testid="level-filter">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Niveles</SelectItem>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" data-testid="search-btn">
                  Buscar
                </Button>

                {hasFilters && (
                  <Button type="button" variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
                    <X className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Contador de Resultados */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              {loading ? 'Cargando...' : `${courses.length} cursos encontrados`}
            </p>
          </div>

          {/* Grilla de Cursos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card animate-pulse">
                  <div className="aspect-video bg-muted rounded-t-xl" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No se encontraron cursos</h3>
              <p className="text-muted-foreground mb-6">
                Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.
              </p>
              <Button onClick={clearFilters}>Limpiar todos los filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link 
                    to={`/courses/${course.id}`} 
                    className="glass-card group block hover:border-primary/30 transition-all duration-300"
                    data-testid={`course-card-${course.id}`}
                  >
                    <div className="aspect-video relative overflow-hidden rounded-t-xl">
                      <img
                        src={course.cover_image || 'https://images.unsplash.com/photo-1513746199652-7a5904642685?w=600'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge 
                        className={`absolute top-4 left-4 ${getLevelColor(course.level)}`}
                      >
                        {getLevelText(course.level)}
                      </Badge>
                      {!course.is_free && (
                        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                          ${course.price}
                        </Badge>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {course.category && (
                          <span className="bg-muted px-2 py-0.5 rounded">{course.category}</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {course.description || 'Sin descripción disponible'}
                      </p>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.lessons_count} lecciones
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.students_count}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>

                      {course.instructor && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                          <img
                            src={course.instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.full_name)}&background=6366f1&color=fff`}
                            alt={course.instructor.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm">{course.instructor.full_name}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseCatalog;
