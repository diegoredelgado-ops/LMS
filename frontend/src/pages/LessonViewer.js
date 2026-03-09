import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  GraduationCap, 
  Play, 
  FileText, 
  File,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const LessonViewer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseId, lessonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);
      
      // Find current lesson
      const currentLesson = courseRes.data.lessons.find(l => l.id === lessonId);
      if (!currentLesson) {
        toast.error('Lesson not found');
        navigate(`/courses/${courseId}`);
        return;
      }
      setLesson(currentLesson);
      
      // Fetch enrollment and progress
      const enrollmentsRes = await api.get('/enrollments');
      const enrolled = enrollmentsRes.data.find(e => e.course_id === courseId);
      setEnrollment(enrolled);
      
      if (enrolled) {
        const progressRes = await api.get(`/enrollments/${enrolled.id}/progress`);
        setCompletedLessons(progressRes.data.completed_lesson_ids || []);
      }
      
      // Fetch comments
      fetchComments();
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
      toast.error('Failed to load lesson');
      navigate(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/lessons/${lessonId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!enrollment) return;
    
    try {
      const res = await api.post(`/enrollments/${enrollment.id}/lessons/${lessonId}/complete`);
      setCompletedLessons(prev => [...prev, lessonId]);
      
      if (res.data.course_completed) {
        toast.success('Congratulations! You completed the course!');
      } else {
        toast.success('Lesson completed!');
      }
    } catch (error) {
      toast.error('Failed to mark lesson as complete');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      await api.post(`/lessons/${lessonId}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
      toast.success('Comment posted!');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const navigateToLesson = (direction) => {
    if (!course) return;
    
    const currentIndex = course.lessons.findIndex(l => l.id === lessonId);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < course.lessons.length) {
      navigate(`/courses/${courseId}/lessons/${course.lessons[newIndex].id}`);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'file': return <File className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading lesson...</div>
      </div>
    );
  }

  if (!course || !lesson) {
    return null;
  }

  const currentIndex = course.lessons.findIndex(l => l.id === lessonId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < course.lessons.length - 1;
  const isCompleted = completedLessons.includes(lessonId);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-40 flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
                <GraduationCap className="w-6 h-6 text-primary" />
                <span className="font-heading font-bold">Lumina</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-border">
              <Link 
                to={`/courses/${courseId}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Course
              </Link>
              <h2 className="font-semibold mt-2 line-clamp-2">{course.title}</h2>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                {course.lessons.map((l, index) => {
                  const isActive = l.id === lessonId;
                  const isLessonCompleted = completedLessons.includes(l.id);

                  return (
                    <Link
                      key={l.id}
                      to={`/courses/${courseId}/lessons/${l.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid={`sidebar-lesson-${l.id}`}
                    >
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        isLessonCompleted 
                          ? 'bg-accent/20 text-accent' 
                          : isActive 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted'
                      }`}>
                        {isLessonCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-mono">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{l.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getLessonIcon(l.lesson_type)}
                          <span className="capitalize">{l.lesson_type}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-30 glass border-b border-white/5 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4" />
              </Button>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Lesson {currentIndex + 1} of {course.lessons.length}</p>
              <h1 className="font-semibold truncate max-w-md">{lesson.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enrollment && !isCompleted && (
              <Button onClick={handleMarkComplete} variant="outline" data-testid="mark-complete-btn">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {isCompleted && (
              <span className="flex items-center gap-2 text-accent text-sm">
                <CheckCircle className="w-4 h-4" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Video Lesson */}
          {lesson.lesson_type === 'video' && lesson.video_url && (
            <div className="video-container mb-8">
              <iframe
                src={getEmbedUrl(lesson.video_url)}
                title={lesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Text Content */}
          {(lesson.lesson_type === 'text' || lesson.content) && (
            <div 
              className="prose-content mb-8"
              dangerouslySetInnerHTML={{ __html: lesson.content || '<p>No content available</p>' }}
            />
          )}

          {/* File Download */}
          {lesson.lesson_type === 'file' && lesson.file_url && (
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <File className="w-10 h-10 text-primary" />
                  <div>
                    <p className="font-medium">{lesson.file_name || 'Download File'}</p>
                    <p className="text-sm text-muted-foreground">Click to download the lesson material</p>
                  </div>
                </div>
                <a href={lesson.file_url} target="_blank" rel="noopener noreferrer" download>
                  <Button data-testid="download-btn">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {lesson.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
              <p className="text-muted-foreground">{lesson.description}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between py-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => navigateToLesson('prev')}
              disabled={!hasPrev}
              data-testid="prev-lesson-btn"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={() => navigateToLesson('next')}
              disabled={!hasNext}
              data-testid="next-lesson-btn"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Comments Section */}
          <div className="py-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Discussion ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask a question or share your thoughts..."
                className="w-full p-4 bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                data-testid="comment-input"
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" disabled={submittingComment || !newComment.trim()} data-testid="submit-comment-btn">
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to start a discussion!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="glass-card p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={comment.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=6366f1&color=fff`}
                        alt={comment.author_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comment.author_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonViewer;
