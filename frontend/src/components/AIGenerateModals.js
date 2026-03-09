import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Sparkles, 
  Loader2, 
  BookOpen, 
  HelpCircle,
  X,
  Check,
  Wand2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const AIGenerateCourseModal = ({ onClose, onCourseCreated }) => {
  const { api } = useAuth();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('beginner');
  const [numLessons, setNumLessons] = useState(5);
  const [language, setLanguage] = useState('es');
  const [generating, setGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Por favor ingresa un tema para el curso');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/ai/generate-course', {
        topic,
        level,
        num_lessons: numLessons,
        language
      });
      setGeneratedCourse(response.data);
      toast.success('¡Curso generado exitosamente!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.detail || 'Error al generar el curso');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!generatedCourse) return;

    setCreating(true);
    try {
      const response = await api.post('/ai/create-course-from-generated', generatedCourse);
      toast.success('¡Curso creado exitosamente!');
      onCourseCreated(response.data.course_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear el curso');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Generar Curso con IA</h3>
              <p className="text-sm text-muted-foreground">Crea un curso completo automáticamente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!generatedCourse ? (
          <div className="space-y-6">
            <div>
              <Label htmlFor="topic">Tema del Curso *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Introducción a Python, Marketing Digital, Diseño UX/UI..."
                data-testid="ai-topic-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nivel</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger data-testid="ai-level-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Número de Lecciones</Label>
                <Select value={String(numLessons)} onValueChange={(v) => setNumLessons(Number(v))}>
                  <SelectTrigger data-testid="ai-lessons-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 lecciones</SelectItem>
                    <SelectItem value="5">5 lecciones</SelectItem>
                    <SelectItem value="7">7 lecciones</SelectItem>
                    <SelectItem value="10">10 lecciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={generating || !topic.trim()}
                className="glow-primary"
                data-testid="ai-generate-btn"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generar Curso
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 text-accent mb-2">
                <Check className="w-4 h-4" />
                <span className="font-medium">Curso Generado</span>
              </div>
              <h4 className="text-lg font-semibold">{generatedCourse.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{generatedCourse.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="capitalize">{generatedCourse.level}</span>
                <span>•</span>
                <span>{generatedCourse.category}</span>
                <span>•</span>
                <span>{generatedCourse.lessons.length} lecciones</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Lecciones Generadas:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generatedCourse.lessons.map((lesson, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setGeneratedCourse(null)}>
                Regenerar
              </Button>
              <Button 
                onClick={handleCreateCourse} 
                disabled={creating}
                className="glow-primary"
                data-testid="ai-create-course-btn"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Crear Curso
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const AIGenerateQuizModal = ({ courseId, courseName, onClose, onQuizCreated }) => {
  const { api } = useAuth();
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [language, setLanguage] = useState('es');
  const [generating, setGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/ai/generate-quiz', {
        course_id: courseId,
        topic: topic || null,
        num_questions: numQuestions,
        language
      });
      setGeneratedQuiz(response.data);
      toast.success('¡Quiz generado exitosamente!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.detail || 'Error al generar el quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!generatedQuiz) return;

    setCreating(true);
    try {
      const response = await api.post(`/ai/create-quiz-from-generated?course_id=${courseId}`, generatedQuiz);
      toast.success('¡Quiz creado exitosamente!');
      onQuizCreated(response.data.quiz_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear el quiz');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Generar Quiz con IA</h3>
              <p className="text-sm text-muted-foreground">Para: {courseName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!generatedQuiz ? (
          <div className="space-y-6">
            <div>
              <Label htmlFor="quiz-topic">Tema Específico (Opcional)</Label>
              <Input
                id="quiz-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Dejar vacío para usar todo el contenido del curso"
                data-testid="ai-quiz-topic-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                La IA analizará el contenido del curso para crear preguntas relevantes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Preguntas</Label>
                <Select value={String(numQuestions)} onValueChange={(v) => setNumQuestions(Number(v))}>
                  <SelectTrigger data-testid="ai-quiz-questions-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 preguntas</SelectItem>
                    <SelectItem value="10">10 preguntas</SelectItem>
                    <SelectItem value="15">15 preguntas</SelectItem>
                    <SelectItem value="20">20 preguntas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={generating}
                className="bg-secondary hover:bg-secondary/90"
                data-testid="ai-generate-quiz-btn"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generar Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <Check className="w-4 h-4" />
                <span className="font-medium">Quiz Generado</span>
              </div>
              <h4 className="text-lg font-semibold">{generatedQuiz.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{generatedQuiz.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Preguntas ({generatedQuiz.questions.length}):</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {generatedQuiz.questions.map((question, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm mb-2">
                      {index + 1}. {question.question_text}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`text-xs p-2 rounded ${
                            optIndex === question.correct_option 
                              ? 'bg-accent/20 text-accent border border-accent/30' 
                              : 'bg-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setGeneratedQuiz(null)}>
                Regenerar
              </Button>
              <Button 
                onClick={handleCreateQuiz} 
                disabled={creating}
                className="bg-secondary hover:bg-secondary/90"
                data-testid="ai-create-quiz-btn"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Crear Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIGenerateCourseModal;
