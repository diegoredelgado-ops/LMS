import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { 
  GraduationCap, 
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Play,
  FileText,
  File,
  Save,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableLesson = ({ lesson, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = () => {
    switch (lesson.lesson_type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'file': return <File className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-card p-4 flex items-center gap-4"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{lesson.title}</p>
        <p className="text-sm text-muted-foreground capitalize">{lesson.lesson_type}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(lesson)} data-testid={`edit-lesson-${lesson.id}`}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(lesson.id)} data-testid={`delete-lesson-${lesson.id}`}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const isNewCourse = courseId === 'new';
  
  const [course, setCourse] = useState({
    title: '',
    description: '',
    cover_image: '',
    category: '',
    level: 'beginner',
    price: 0,
    is_free: true,
    is_published: false
  });
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(!isNewCourse);
  const [saving, setSaving] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isNewCourse) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Course not found');
      navigate('/instructor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!course.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    setSaving(true);

    try {
      if (isNewCourse) {
        const response = await api.post('/courses', course);
        toast.success('Course created!');
        navigate(`/courses/${response.data.id}/edit`);
      } else {
        await api.put(`/courses/${courseId}`, course);
        toast.success('Course saved!');
      }
    } catch (error) {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (editingLesson) {
        await api.put(`/courses/${courseId}/lessons/${editingLesson.id}`, lessonData);
        toast.success('Lesson updated!');
      } else {
        await api.post(`/courses/${courseId}/lessons`, lessonData);
        toast.success('Lesson created!');
      }
      
      fetchCourse();
      setShowLessonForm(false);
      setEditingLesson(null);
    } catch (error) {
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
      toast.success('Lesson deleted');
      fetchCourse();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      
      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);
      
      try {
        await api.put(`/courses/${courseId}/lessons/reorder`, {
          lesson_ids: newLessons.map(l => l.id)
        });
      } catch (error) {
        toast.error('Failed to reorder lessons');
        fetchCourse();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instructor" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <span className="font-heading font-bold">Course Editor</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isNewCourse && (
              <Link to={`/courses/${courseId}`}>
                <Button variant="outline" size="sm" data-testid="preview-course-btn">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </Link>
            )}
            <Button onClick={handleSaveCourse} disabled={saving} data-testid="save-course-btn">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-8">
        {/* Course Details */}
        <section className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Course Details</h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                placeholder="e.g., Introduction to Web Development"
                data-testid="course-title-input"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={course.description || ''}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                placeholder="Describe what students will learn..."
                rows={4}
                data-testid="course-description-input"
              />
            </div>

            <div>
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                value={course.cover_image || ''}
                onChange={(e) => setCourse({ ...course, cover_image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                data-testid="course-cover-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={course.category || ''}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  placeholder="e.g., Web Development"
                  data-testid="course-category-input"
                />
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Select value={course.level} onValueChange={(v) => setCourse({ ...course, level: v })}>
                  <SelectTrigger data-testid="course-level-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label>Free Course</Label>
                  <p className="text-sm text-muted-foreground">Make this course available for free</p>
                </div>
                <Switch
                  checked={course.is_free}
                  onCheckedChange={(checked) => setCourse({ ...course, is_free: checked, price: checked ? 0 : course.price })}
                  data-testid="course-free-toggle"
                />
              </div>

              {!course.is_free && (
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                    data-testid="course-price-input"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label>Published</Label>
                <p className="text-sm text-muted-foreground">Make this course visible to students</p>
              </div>
              <Switch
                checked={course.is_published}
                onCheckedChange={(checked) => setCourse({ ...course, is_published: checked })}
                data-testid="course-published-toggle"
              />
            </div>
          </div>
        </section>

        {/* Lessons Section */}
        {!isNewCourse && (
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Lessons ({lessons.length})</h2>
              <Button onClick={() => { setEditingLesson(null); setShowLessonForm(true); }} data-testid="add-lesson-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No lessons yet. Add your first lesson to get started.</p>
                <Button onClick={() => { setEditingLesson(null); setShowLessonForm(true); }} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Lesson
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <SortableLesson
                        key={lesson.id}
                        lesson={lesson}
                        onEdit={(l) => { setEditingLesson(l); setShowLessonForm(true); }}
                        onDelete={handleDeleteLesson}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>
        )}

        {/* Lesson Form Modal */}
        {showLessonForm && (
          <LessonForm
            lesson={editingLesson}
            onSave={handleSaveLesson}
            onClose={() => { setShowLessonForm(false); setEditingLesson(null); }}
          />
        )}
      </main>
    </div>
  );
};

const LessonForm = ({ lesson, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    lesson_type: lesson?.lesson_type || 'text',
    content: lesson?.content || '',
    video_url: lesson?.video_url || '',
    file_url: lesson?.file_url || '',
    file_name: lesson?.file_name || '',
    duration_minutes: lesson?.duration_minutes || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <h3 className="text-xl font-semibold mb-6">
          {lesson ? 'Edit Lesson' : 'Add New Lesson'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="lesson-title">Title *</Label>
            <Input
              id="lesson-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Lesson title"
              data-testid="lesson-title-input"
            />
          </div>

          <div>
            <Label htmlFor="lesson-description">Description</Label>
            <Textarea
              id="lesson-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this lesson"
              rows={2}
            />
          </div>

          <div>
            <Label>Lesson Type</Label>
            <Select value={formData.lesson_type} onValueChange={(v) => setFormData({ ...formData, lesson_type: v })}>
              <SelectTrigger data-testid="lesson-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Content</SelectItem>
                <SelectItem value="video">Video (YouTube/Vimeo)</SelectItem>
                <SelectItem value="file">File Download</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.lesson_type === 'text' && (
            <div>
              <Label htmlFor="lesson-content">Content (HTML)</Label>
              <Textarea
                id="lesson-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="<h2>Lesson content...</h2><p>Your content here</p>"
                rows={8}
                className="font-mono text-sm"
                data-testid="lesson-content-input"
              />
            </div>
          )}

          {formData.lesson_type === 'video' && (
            <>
              <div>
                <Label htmlFor="video-url">Video URL (YouTube or Vimeo)</Label>
                <Input
                  id="video-url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  data-testid="lesson-video-input"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </>
          )}

          {formData.lesson_type === 'file' && (
            <>
              <div>
                <Label htmlFor="file-url">File URL</Label>
                <Input
                  id="file-url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://example.com/document.pdf"
                  data-testid="lesson-file-input"
                />
              </div>
              <div>
                <Label htmlFor="file-name">File Name</Label>
                <Input
                  id="file-name"
                  value={formData.file_name}
                  onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  placeholder="document.pdf"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-lesson-btn">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-lesson-btn">
              {saving ? 'Saving...' : lesson ? 'Update Lesson' : 'Add Lesson'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditor;
