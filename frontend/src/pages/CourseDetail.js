import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  GraduationCap, 
  Play, 
  FileText, 
  File,
  BookOpen, 
  Users, 
  Clock,
  CheckCircle,
  Lock,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { api, isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourse();
    if (isAuthenticated) {
      checkEnrollment();
    }
  }, [courseId, isAuthenticated]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await api.get('/enrollments');
      const enrolled = response.data.find(e => e.course_id === courseId);
      setEnrollment(enrolled);
    } catch (error) {
      console.error('Failed to check enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);

    try {
      if (!course.is_free) {
        // Redirect to payment
        const response = await api.post('/payments/checkout', {
          course_id: courseId,
          origin_url: window.location.origin
        });
        window.location.href = response.data.url;
        return;
      }

      // Free course - enroll directly
      await api.post(`/courses/${courseId}/enroll`);
      toast.success('Successfully enrolled!');
      checkEnrollment();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'file': return <File className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const canAccessLessons = enrollment || user?.id === course.instructor_id || user?.role === 'admin';
  const progressPercentage = enrollment?.progress_percentage || 0;

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

            <div className="flex items-center gap-4">
              <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Courses
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 md:px-12 lg:px-24 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {course.category && (
                    <Badge variant="outline">{course.category}</Badge>
                  )}
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  {course.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">
                  {course.description || 'No description available'}
                </p>

                {course.instructor && (
                  <div className="flex items-center gap-4">
                    <img
                      src={course.instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.full_name)}&background=6366f1&color=fff`}
                      alt={course.instructor.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Instructor</p>
                      <p className="font-medium">{course.instructor.full_name}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="glass-card p-6 sticky top-24"
              >
                <div className="aspect-video relative overflow-hidden rounded-lg mb-6">
                  <img
                    src={course.cover_image || 'https://images.unsplash.com/photo-1513746199652-7a5904642685?w=600'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  {enrollment ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Your Progress</span>
                          <span className="font-medium">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {enrollment.completed_lessons} of {enrollment.total_lessons} lessons completed
                        </p>
                      </div>
                      <Button 
                        className="w-full glow-primary" 
                        onClick={() => {
                          const firstLesson = course.lessons[0];
                          if (firstLesson) {
                            navigate(`/courses/${courseId}/lessons/${firstLesson.id}`);
                          }
                        }}
                        data-testid="continue-btn"
                      >
                        Continue Learning
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        {course.is_free ? (
                          <p className="text-2xl font-bold text-accent">Free</p>
                        ) : (
                          <p className="text-2xl font-bold">${course.price}</p>
                        )}
                      </div>
                      <Button 
                        className="w-full glow-primary" 
                        onClick={handleEnroll}
                        disabled={enrolling}
                        data-testid="enroll-btn"
                      >
                        {enrolling ? (
                          'Processing...'
                        ) : course.is_free ? (
                          'Enroll for Free'
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Purchase Course
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.lessons_count} lessons</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{course.students_count} students enrolled</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {course.lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0)} min total
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Lessons List */}
      <section className="py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-heading font-bold mb-6">Course Content</h2>

            {course.lessons.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No lessons available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => {
                  const isAccessible = canAccessLessons;
                  const isCompleted = enrollment?.completed_lesson_ids?.includes(lesson.id);

                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      {isAccessible ? (
                        <Link
                          to={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="glass-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors group"
                          data-testid={`lesson-${lesson.id}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <span className="font-mono">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {getLessonIcon(lesson.lesson_type)}
                              <span className="capitalize">{lesson.lesson_type}</span>
                              {lesson.duration_minutes > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{lesson.duration_minutes} min</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      ) : (
                        <div className="glass-card p-4 flex items-center gap-4 opacity-60">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <span className="font-mono">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{lesson.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {getLessonIcon(lesson.lesson_type)}
                              <span className="capitalize">{lesson.lesson_type}</span>
                            </div>
                          </div>
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;
