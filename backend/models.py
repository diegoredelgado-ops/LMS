from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime
import enum

def generate_uuid():
    return str(uuid.uuid4())

def utcnow():
    return datetime.utcnow()

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"

class CourseLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class LessonType(str, enum.Enum):
    VIDEO = "video"
    TEXT = "text"
    FILE = "file"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# User Model
class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False, index=True)
    github_id = Column(String(100), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: utcnow())
    updated_at = Column(DateTime, default=lambda: utcnow(), onupdate=lambda: utcnow())
    
    # Relationships
    courses_created = relationship('Course', back_populates='instructor', cascade='all, delete-orphan')
    enrollments = relationship('Enrollment', back_populates='student', cascade='all, delete-orphan')
    quiz_attempts = relationship('QuizAttempt', back_populates='student', cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='author', cascade='all, delete-orphan')

# Course Model
class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    level = Column(SQLEnum(CourseLevel), default=CourseLevel.BEGINNER)
    price = Column(Float, default=0.0)
    is_free = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False, index=True)
    instructor_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: utcnow())
    updated_at = Column(DateTime, default=lambda: utcnow(), onupdate=lambda: utcnow())
    
    # Relationships
    instructor = relationship('User', back_populates='courses_created')
    lessons = relationship('Lesson', back_populates='course', cascade='all, delete-orphan', order_by='Lesson.order')
    enrollments = relationship('Enrollment', back_populates='course', cascade='all, delete-orphan')
    quizzes = relationship('Quiz', back_populates='course', cascade='all, delete-orphan')

# Lesson Model
class Lesson(Base):
    __tablename__ = 'lessons'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    lesson_type = Column(SQLEnum(LessonType), default=LessonType.TEXT)
    content = Column(Text, nullable=True)  # For text lessons
    video_url = Column(String(500), nullable=True)  # For video lessons (YouTube/Vimeo)
    file_url = Column(String(500), nullable=True)  # For file lessons
    file_name = Column(String(255), nullable=True)
    duration_minutes = Column(Integer, default=0)
    order = Column(Integer, default=0, index=True)
    course_id = Column(String(36), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: utcnow())
    updated_at = Column(DateTime, default=lambda: utcnow(), onupdate=lambda: utcnow())
    
    # Relationships
    course = relationship('Course', back_populates='lessons')
    progress_records = relationship('LessonProgress', back_populates='lesson', cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='lesson', cascade='all, delete-orphan')

# Enrollment Model
class Enrollment(Base):
    __tablename__ = 'enrollments'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    enrolled_at = Column(DateTime, default=lambda: utcnow())
    completed_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    student = relationship('User', back_populates='enrollments')
    course = relationship('Course', back_populates='enrollments')
    progress = relationship('LessonProgress', back_populates='enrollment', cascade='all, delete-orphan')

# Lesson Progress Model
class LessonProgress(Base):
    __tablename__ = 'lesson_progress'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    enrollment_id = Column(String(36), ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False, index=True)
    lesson_id = Column(String(36), ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False, index=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    enrollment = relationship('Enrollment', back_populates='progress')
    lesson = relationship('Lesson', back_populates='progress_records')

# Quiz Model
class Quiz(Base):
    __tablename__ = 'quizzes'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(String(36), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    passing_score = Column(Integer, default=70)
    created_at = Column(DateTime, default=lambda: utcnow())
    
    # Relationships
    course = relationship('Course', back_populates='quizzes')
    questions = relationship('QuizQuestion', back_populates='quiz', cascade='all, delete-orphan')
    attempts = relationship('QuizAttempt', back_populates='quiz', cascade='all, delete-orphan')

# Quiz Question Model
class QuizQuestion(Base):
    __tablename__ = 'quiz_questions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of options
    correct_option = Column(Integer, nullable=False)  # Index of correct option
    order = Column(Integer, default=0)
    
    # Relationships
    quiz = relationship('Quiz', back_populates='questions')

# Quiz Attempt Model
class QuizAttempt(Base):
    __tablename__ = 'quiz_attempts'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    quiz_id = Column(String(36), ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False, index=True)
    score = Column(Integer, default=0)
    answers = Column(JSON, nullable=True)  # Student's answers
    passed = Column(Boolean, default=False)
    attempted_at = Column(DateTime, default=lambda: utcnow())
    
    # Relationships
    student = relationship('User', back_populates='quiz_attempts')
    quiz = relationship('Quiz', back_populates='attempts')

# Comment Model
class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    content = Column(Text, nullable=False)
    author_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    lesson_id = Column(String(36), ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    created_at = Column(DateTime, default=lambda: utcnow())
    updated_at = Column(DateTime, default=lambda: utcnow(), onupdate=lambda: utcnow())
    
    # Relationships
    author = relationship('User', back_populates='comments')
    lesson = relationship('Lesson', back_populates='comments')
    replies = relationship('Comment', back_populates='parent_comment', remote_side=[id])
    parent_comment = relationship('Comment', back_populates='replies', remote_side=[parent_id])

# Payment Transaction Model
class PaymentTransaction(Base):
    __tablename__ = 'payment_transactions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='usd')
    stripe_session_id = Column(String(255), unique=True, nullable=True, index=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    created_at = Column(DateTime, default=lambda: utcnow())
    updated_at = Column(DateTime, default=lambda: utcnow(), onupdate=lambda: utcnow())
