from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import selectinload
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import httpx

from database import get_db, engine, Base
from models import (
    User, UserRole, Course, CourseLevel, Lesson, LessonType,
    Enrollment, LessonProgress, Quiz, QuizQuestion, QuizAttempt,
    Comment, PaymentTransaction, PaymentStatus
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'lumina-lms-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# GitHub OAuth Configuration
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="Lumina LMS API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== PYDANTIC SCHEMAS ====================

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[UserRole] = UserRole.STUDENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class GitHubCallbackRequest(BaseModel):
    code: str

# Course Schemas
class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    level: CourseLevel = CourseLevel.BEGINNER
    price: float = 0.0
    is_free: bool = True

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    level: Optional[CourseLevel] = None
    price: Optional[float] = None
    is_free: Optional[bool] = None
    is_published: Optional[bool] = None

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    lesson_type: LessonType = LessonType.TEXT
    content: Optional[str] = None
    video_url: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    duration_minutes: int = 0
    order: int = 0

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    lesson_type: Optional[LessonType] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    order: Optional[int] = None

class LessonReorder(BaseModel):
    lesson_ids: List[str]

class LessonResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    lesson_type: LessonType
    content: Optional[str] = None
    video_url: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    duration_minutes: int
    order: int
    course_id: str
    created_at: datetime

class InstructorResponse(BaseModel):
    id: str
    full_name: str
    avatar_url: Optional[str] = None

class CourseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    level: CourseLevel
    price: float
    is_free: bool
    is_published: bool
    instructor_id: str
    instructor: Optional[InstructorResponse] = None
    lessons_count: int = 0
    students_count: int = 0
    created_at: datetime

class CourseDetailResponse(CourseResponse):
    lessons: List[LessonResponse] = []

# Enrollment Schemas
class EnrollmentResponse(BaseModel):
    id: str
    course_id: str
    course: Optional[CourseResponse] = None
    enrolled_at: datetime
    is_completed: bool
    completed_at: Optional[datetime] = None
    progress_percentage: float = 0.0
    completed_lessons: int = 0
    total_lessons: int = 0

# Quiz Schemas
class QuizQuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_option: int
    order: int = 0

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    passing_score: int = 70
    questions: List[QuizQuestionCreate] = []

class QuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    options: List[str]
    order: int

class QuizResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    course_id: str
    passing_score: int
    questions: List[QuizQuestionResponse] = []

class QuizSubmit(BaseModel):
    answers: dict  # {question_id: selected_option_index}

class QuizAttemptResponse(BaseModel):
    id: str
    quiz_id: str
    score: int
    passed: bool
    attempted_at: datetime

# Comment Schemas
class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    lesson_id: str
    parent_id: Optional[str] = None
    created_at: datetime
    replies: List['CommentResponse'] = []

# Payment Schemas
class CheckoutRequest(BaseModel):
    course_id: str
    origin_url: str

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

# Admin Schemas
class PlatformStats(BaseModel):
    total_users: int
    total_students: int
    total_instructors: int
    total_courses: int
    total_enrollments: int
    total_revenue: float

class UserAdminResponse(UserResponse):
    courses_count: int = 0
    enrollments_count: int = 0

# ==================== HELPER FUNCTIONS ====================

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

def require_role(allowed_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create token
    access_token = create_access_token({"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

@api_router.post("/auth/github/callback", response_model=TokenResponse)
async def github_callback(data: GitHubCallbackRequest, db: AsyncSession = Depends(get_db)):
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": data.code
            },
            headers={"Accept": "application/json"}
        )
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get GitHub access token")
        
        # Get user info from GitHub
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token_data['access_token']}",
                "Accept": "application/json"
            }
        )
        github_user = user_response.json()
        
        # Get user emails
        emails_response = await client.get(
            "https://api.github.com/user/emails",
            headers={
                "Authorization": f"Bearer {token_data['access_token']}",
                "Accept": "application/json"
            }
        )
        emails = emails_response.json()
        primary_email = next((e["email"] for e in emails if e.get("primary")), github_user.get("email"))
    
    if not primary_email:
        raise HTTPException(status_code=400, detail="Could not get email from GitHub")
    
    # Check if user exists
    result = await db.execute(
        select(User).where((User.github_id == str(github_user["id"])) | (User.email == primary_email))
    )
    user = result.scalar_one_or_none()
    
    if user:
        # Update GitHub ID if not set
        if not user.github_id:
            user.github_id = str(github_user["id"])
            await db.commit()
    else:
        # Create new user
        user = User(
            email=primary_email,
            full_name=github_user.get("name") or github_user.get("login"),
            avatar_url=github_user.get("avatar_url"),
            github_id=str(github_user["id"]),
            role=UserRole.STUDENT
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    access_token = create_access_token({"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(user_data: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    if user_data.avatar_url is not None:
        current_user.avatar_url = user_data.avatar_url
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

# ==================== COURSE ROUTES ====================

@api_router.get("/courses", response_model=List[CourseResponse])
async def list_courses(
    category: Optional[str] = None,
    level: Optional[CourseLevel] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
    db: AsyncSession = Depends(get_db)
):
    query = select(Course).where(Course.is_published == True).options(selectinload(Course.instructor))
    
    if category:
        query = query.where(Course.category == category)
    if level:
        query = query.where(Course.level == level)
    if search:
        query = query.where(Course.title.ilike(f"%{search}%"))
    
    query = query.order_by(Course.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    response = []
    for course in courses:
        # Get counts
        lessons_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.course_id == course.id))
        lessons_count = lessons_result.scalar()
        
        enrollments_result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id))
        students_count = enrollments_result.scalar()
        
        response.append(CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            cover_image=course.cover_image,
            category=course.category,
            level=course.level,
            price=course.price,
            is_free=course.is_free,
            is_published=course.is_published,
            instructor_id=course.instructor_id,
            instructor=InstructorResponse(
                id=course.instructor.id,
                full_name=course.instructor.full_name,
                avatar_url=course.instructor.avatar_url
            ) if course.instructor else None,
            lessons_count=lessons_count,
            students_count=students_count,
            created_at=course.created_at
        ))
    
    return response

@api_router.get("/courses/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course.category, func.count(Course.id).label('count'))
        .where(Course.is_published == True, Course.category != None)
        .group_by(Course.category)
    )
    categories = result.all()
    return [{"name": cat, "count": count} for cat, count in categories]

@api_router.get("/courses/{course_id}", response_model=CourseDetailResponse)
async def get_course(course_id: str, current_user: Optional[User] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.instructor), selectinload(Course.lessons))
        .where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if user can view unpublished course
    if not course.is_published:
        if not current_user or (current_user.id != course.instructor_id and current_user.role != UserRole.ADMIN):
            raise HTTPException(status_code=404, detail="Course not found")
    
    # Get counts
    enrollments_result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id))
    students_count = enrollments_result.scalar()
    
    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        cover_image=course.cover_image,
        category=course.category,
        level=course.level,
        price=course.price,
        is_free=course.is_free,
        is_published=course.is_published,
        instructor_id=course.instructor_id,
        instructor=InstructorResponse(
            id=course.instructor.id,
            full_name=course.instructor.full_name,
            avatar_url=course.instructor.avatar_url
        ) if course.instructor else None,
        lessons_count=len(course.lessons),
        students_count=students_count,
        created_at=course.created_at,
        lessons=[LessonResponse(
            id=lesson.id,
            title=lesson.title,
            description=lesson.description,
            lesson_type=lesson.lesson_type,
            content=lesson.content,
            video_url=lesson.video_url,
            file_url=lesson.file_url,
            file_name=lesson.file_name,
            duration_minutes=lesson.duration_minutes,
            order=lesson.order,
            course_id=lesson.course_id,
            created_at=lesson.created_at
        ) for lesson in sorted(course.lessons, key=lambda x: x.order)]
    )

@api_router.post("/courses", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    course = Course(
        title=course_data.title,
        description=course_data.description,
        cover_image=course_data.cover_image,
        category=course_data.category,
        level=course_data.level,
        price=course_data.price,
        is_free=course_data.is_free,
        instructor_id=current_user.id
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        cover_image=course.cover_image,
        category=course.category,
        level=course.level,
        price=course.price,
        is_free=course.is_free,
        is_published=course.is_published,
        instructor_id=course.instructor_id,
        lessons_count=0,
        students_count=0,
        created_at=course.created_at
    )

@api_router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseUpdate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role != UserRole.ADMIN and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this course")
    
    update_data = course_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(course, key, value)
    
    await db.commit()
    await db.refresh(course)
    
    # Get counts
    lessons_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.course_id == course.id))
    lessons_count = lessons_result.scalar()
    
    enrollments_result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id))
    students_count = enrollments_result.scalar()
    
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        cover_image=course.cover_image,
        category=course.category,
        level=course.level,
        price=course.price,
        is_free=course.is_free,
        is_published=course.is_published,
        instructor_id=course.instructor_id,
        lessons_count=lessons_count,
        students_count=students_count,
        created_at=course.created_at
    )

@api_router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role != UserRole.ADMIN and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")
    
    await db.delete(course)
    await db.commit()
    
    return {"message": "Course deleted successfully"}

# ==================== LESSON ROUTES ====================

@api_router.post("/courses/{course_id}/lessons", response_model=LessonResponse)
async def create_lesson(
    course_id: str,
    lesson_data: LessonCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role != UserRole.ADMIN and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add lessons to this course")
    
    # Get max order
    max_order_result = await db.execute(select(func.max(Lesson.order)).where(Lesson.course_id == course_id))
    max_order = max_order_result.scalar() or 0
    
    lesson = Lesson(
        title=lesson_data.title,
        description=lesson_data.description,
        lesson_type=lesson_data.lesson_type,
        content=lesson_data.content,
        video_url=lesson_data.video_url,
        file_url=lesson_data.file_url,
        file_name=lesson_data.file_name,
        duration_minutes=lesson_data.duration_minutes,
        order=lesson_data.order if lesson_data.order > 0 else max_order + 1,
        course_id=course_id
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    
    return LessonResponse(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        lesson_type=lesson.lesson_type,
        content=lesson.content,
        video_url=lesson.video_url,
        file_url=lesson.file_url,
        file_name=lesson.file_name,
        duration_minutes=lesson.duration_minutes,
        order=lesson.order,
        course_id=lesson.course_id,
        created_at=lesson.created_at
    )

@api_router.put("/courses/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    course_id: str,
    lesson_id: str,
    lesson_data: LessonUpdate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.course)).where(Lesson.id == lesson_id, Lesson.course_id == course_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if current_user.role != UserRole.ADMIN and lesson.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this lesson")
    
    update_data = lesson_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lesson, key, value)
    
    await db.commit()
    await db.refresh(lesson)
    
    return LessonResponse(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        lesson_type=lesson.lesson_type,
        content=lesson.content,
        video_url=lesson.video_url,
        file_url=lesson.file_url,
        file_name=lesson.file_name,
        duration_minutes=lesson.duration_minutes,
        order=lesson.order,
        course_id=lesson.course_id,
        created_at=lesson.created_at
    )

@api_router.delete("/courses/{course_id}/lessons/{lesson_id}")
async def delete_lesson(
    course_id: str,
    lesson_id: str,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.course)).where(Lesson.id == lesson_id, Lesson.course_id == course_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if current_user.role != UserRole.ADMIN and lesson.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this lesson")
    
    await db.delete(lesson)
    await db.commit()
    
    return {"message": "Lesson deleted successfully"}

@api_router.put("/courses/{course_id}/lessons/reorder")
async def reorder_lessons(
    course_id: str,
    reorder_data: LessonReorder,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role != UserRole.ADMIN and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reorder lessons")
    
    for order, lesson_id in enumerate(reorder_data.lesson_ids, start=1):
        await db.execute(
            update(Lesson).where(Lesson.id == lesson_id, Lesson.course_id == course_id).values(order=order)
        )
    
    await db.commit()
    
    return {"message": "Lessons reordered successfully"}

# ==================== ENROLLMENT ROUTES ====================

@api_router.post("/courses/{course_id}/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if course exists and is published
    result = await db.execute(select(Course).options(selectinload(Course.lessons)).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course or not course.is_published:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.student_id == current_user.id, Enrollment.course_id == course_id)
    )
    existing_enrollment = enrollment_result.scalar_one_or_none()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # For paid courses, check if payment completed
    if not course.is_free:
        payment_result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.user_id == current_user.id,
                PaymentTransaction.course_id == course_id,
                PaymentTransaction.status == PaymentStatus.COMPLETED
            )
        )
        if not payment_result.scalar_one_or_none():
            raise HTTPException(status_code=402, detail="Payment required for this course")
    
    # Create enrollment
    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=course_id
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return EnrollmentResponse(
        id=enrollment.id,
        course_id=enrollment.course_id,
        enrolled_at=enrollment.enrolled_at,
        is_completed=enrollment.is_completed,
        completed_at=enrollment.completed_at,
        progress_percentage=0.0,
        completed_lessons=0,
        total_lessons=len(course.lessons)
    )

@api_router.get("/enrollments", response_model=List[EnrollmentResponse])
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.course).selectinload(Course.instructor), selectinload(Enrollment.progress))
        .where(Enrollment.student_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = result.scalars().all()
    
    response = []
    for enrollment in enrollments:
        course = enrollment.course
        # Get total lessons count
        lessons_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.course_id == course.id))
        total_lessons = lessons_result.scalar()
        
        completed_lessons = len([p for p in enrollment.progress if p.is_completed])
        progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        
        response.append(EnrollmentResponse(
            id=enrollment.id,
            course_id=enrollment.course_id,
            course=CourseResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                cover_image=course.cover_image,
                category=course.category,
                level=course.level,
                price=course.price,
                is_free=course.is_free,
                is_published=course.is_published,
                instructor_id=course.instructor_id,
                instructor=InstructorResponse(
                    id=course.instructor.id,
                    full_name=course.instructor.full_name,
                    avatar_url=course.instructor.avatar_url
                ) if course.instructor else None,
                lessons_count=total_lessons,
                students_count=0,
                created_at=course.created_at
            ),
            enrolled_at=enrollment.enrolled_at,
            is_completed=enrollment.is_completed,
            completed_at=enrollment.completed_at,
            progress_percentage=progress_percentage,
            completed_lessons=completed_lessons,
            total_lessons=total_lessons
        ))
    
    return response

@api_router.post("/enrollments/{enrollment_id}/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    enrollment_id: str,
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify enrollment belongs to user
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.student_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Verify lesson belongs to course
    lesson_result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id, Lesson.course_id == enrollment.course_id)
    )
    lesson = lesson_result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check if progress record exists
    progress_result = await db.execute(
        select(LessonProgress).where(LessonProgress.enrollment_id == enrollment_id, LessonProgress.lesson_id == lesson_id)
    )
    progress = progress_result.scalar_one_or_none()
    
    if progress:
        progress.is_completed = True
        progress.completed_at = datetime.now(timezone.utc)
    else:
        progress = LessonProgress(
            enrollment_id=enrollment_id,
            lesson_id=lesson_id,
            is_completed=True,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(progress)
    
    # Check if all lessons are completed
    total_lessons_result = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == enrollment.course_id)
    )
    total_lessons = total_lessons_result.scalar()
    
    completed_result = await db.execute(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.enrollment_id == enrollment_id,
            LessonProgress.is_completed == True
        )
    )
    # Add 1 for current lesson being marked complete
    completed_count = completed_result.scalar()
    if not progress.id:  # New record
        completed_count += 1
    
    if completed_count >= total_lessons:
        enrollment.is_completed = True
        enrollment.completed_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"message": "Lesson marked as complete", "course_completed": enrollment.is_completed}

@api_router.get("/enrollments/{enrollment_id}/progress")
async def get_enrollment_progress(
    enrollment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.progress))
        .where(Enrollment.id == enrollment_id, Enrollment.student_id == current_user.id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    completed_lesson_ids = [p.lesson_id for p in enrollment.progress if p.is_completed]
    
    return {
        "enrollment_id": enrollment_id,
        "completed_lesson_ids": completed_lesson_ids,
        "is_course_completed": enrollment.is_completed
    }

# ==================== QUIZ ROUTES ====================

@api_router.post("/courses/{course_id}/quizzes", response_model=QuizResponse)
async def create_quiz(
    course_id: str,
    quiz_data: QuizCreate,
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role != UserRole.ADMIN and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        course_id=course_id,
        passing_score=quiz_data.passing_score
    )
    db.add(quiz)
    await db.flush()
    
    for q_data in quiz_data.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            options=q_data.options,
            correct_option=q_data.correct_option,
            order=q_data.order
        )
        db.add(question)
    
    await db.commit()
    await db.refresh(quiz)
    
    # Fetch questions
    questions_result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.order)
    )
    questions = questions_result.scalars().all()
    
    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        course_id=quiz.course_id,
        passing_score=quiz.passing_score,
        questions=[QuizQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            order=q.order
        ) for q in questions]
    )

@api_router.get("/courses/{course_id}/quizzes", response_model=List[QuizResponse])
async def get_course_quizzes(
    course_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.course_id == course_id)
    )
    quizzes = result.scalars().all()
    
    return [QuizResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        course_id=quiz.course_id,
        passing_score=quiz.passing_score,
        questions=[QuizQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            order=q.order
        ) for q in sorted(quiz.questions, key=lambda x: x.order)]
    ) for quiz in quizzes]

@api_router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Calculate score
    correct = 0
    total = len(quiz.questions)
    
    for question in quiz.questions:
        if submission.answers.get(question.id) == question.correct_option:
            correct += 1
    
    score = int((correct / total) * 100) if total > 0 else 0
    passed = score >= quiz.passing_score
    
    attempt = QuizAttempt(
        student_id=current_user.id,
        quiz_id=quiz_id,
        score=score,
        answers=submission.answers,
        passed=passed
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    
    return QuizAttemptResponse(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        passed=attempt.passed,
        attempted_at=attempt.attempted_at
    )

# ==================== COMMENT ROUTES ====================

@api_router.post("/lessons/{lesson_id}/comments", response_model=CommentResponse)
async def create_comment(
    lesson_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify lesson exists
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    comment = Comment(
        content=comment_data.content,
        author_id=current_user.id,
        lesson_id=lesson_id,
        parent_id=comment_data.parent_id
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    return CommentResponse(
        id=comment.id,
        content=comment.content,
        author_id=comment.author_id,
        author_name=current_user.full_name,
        author_avatar=current_user.avatar_url,
        lesson_id=comment.lesson_id,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
        replies=[]
    )

@api_router.get("/lessons/{lesson_id}/comments", response_model=List[CommentResponse])
async def get_lesson_comments(
    lesson_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.lesson_id == lesson_id, Comment.parent_id == None)
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    
    async def build_comment_tree(comment):
        replies_result = await db.execute(
            select(Comment)
            .options(selectinload(Comment.author))
            .where(Comment.parent_id == comment.id)
            .order_by(Comment.created_at.asc())
        )
        replies = replies_result.scalars().all()
        
        return CommentResponse(
            id=comment.id,
            content=comment.content,
            author_id=comment.author_id,
            author_name=comment.author.full_name,
            author_avatar=comment.author.avatar_url,
            lesson_id=comment.lesson_id,
            parent_id=comment.parent_id,
            created_at=comment.created_at,
            replies=[await build_comment_tree(r) for r in replies]
        )
    
    return [await build_comment_tree(c) for c in comments]

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout(
    checkout_data: CheckoutRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    # Get course
    result = await db.execute(select(Course).where(Course.id == checkout_data.course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.is_free:
        raise HTTPException(status_code=400, detail="This course is free")
    
    # Check if already purchased
    payment_result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.user_id == current_user.id,
            PaymentTransaction.course_id == course.id,
            PaymentTransaction.status == PaymentStatus.COMPLETED
        )
    )
    if payment_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Course already purchased")
    
    # Create Stripe checkout
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{checkout_data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_data.origin_url}/courses/{course.id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(course.price),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user.id,
            "course_id": course.id,
            "course_title": course.title
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        user_id=current_user.id,
        course_id=course.id,
        amount=course.price,
        stripe_session_id=session.session_id,
        status=PaymentStatus.PENDING
    )
    db.add(transaction)
    await db.commit()
    
    return CheckoutResponse(url=session.url, session_id=session.session_id)

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.stripe_session_id == session_id)
    )
    transaction = result.scalar_one_or_none()
    
    if transaction and status.payment_status == 'paid' and transaction.status != PaymentStatus.COMPLETED:
        transaction.status = PaymentStatus.COMPLETED
        await db.commit()
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total / 100,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key)
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == 'paid':
            result = await db.execute(
                select(PaymentTransaction).where(PaymentTransaction.stripe_session_id == event.session_id)
            )
            transaction = result.scalar_one_or_none()
            
            if transaction and transaction.status != PaymentStatus.COMPLETED:
                transaction.status = PaymentStatus.COMPLETED
                await db.commit()
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ==================== INSTRUCTOR DASHBOARD ROUTES ====================

@api_router.get("/instructor/courses", response_model=List[CourseResponse])
async def get_instructor_courses(
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Course).where(Course.instructor_id == current_user.id).order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()
    
    response = []
    for course in courses:
        lessons_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.course_id == course.id))
        lessons_count = lessons_result.scalar()
        
        enrollments_result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id))
        students_count = enrollments_result.scalar()
        
        response.append(CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            cover_image=course.cover_image,
            category=course.category,
            level=course.level,
            price=course.price,
            is_free=course.is_free,
            is_published=course.is_published,
            instructor_id=course.instructor_id,
            lessons_count=lessons_count,
            students_count=students_count,
            created_at=course.created_at
        ))
    
    return response

@api_router.get("/instructor/stats")
async def get_instructor_stats(
    current_user: User = Depends(require_role([UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Get course IDs
    courses_result = await db.execute(
        select(Course.id).where(Course.instructor_id == current_user.id)
    )
    course_ids = [c for c in courses_result.scalars().all()]
    
    # Total courses
    total_courses = len(course_ids)
    
    # Total students
    if course_ids:
        students_result = await db.execute(
            select(func.count(func.distinct(Enrollment.student_id))).where(Enrollment.course_id.in_(course_ids))
        )
        total_students = students_result.scalar()
        
        # Average progress
        progress_result = await db.execute(
            select(func.avg(
                select(func.count(LessonProgress.id))
                .where(LessonProgress.enrollment_id == Enrollment.id, LessonProgress.is_completed == True)
                .correlate(Enrollment)
                .scalar_subquery()
            )).where(Enrollment.course_id.in_(course_ids))
        )
        avg_progress = progress_result.scalar() or 0
        
        # Total revenue
        revenue_result = await db.execute(
            select(func.sum(PaymentTransaction.amount)).where(
                PaymentTransaction.course_id.in_(course_ids),
                PaymentTransaction.status == PaymentStatus.COMPLETED
            )
        )
        total_revenue = revenue_result.scalar() or 0
    else:
        total_students = 0
        avg_progress = 0
        total_revenue = 0
    
    return {
        "total_courses": total_courses,
        "total_students": total_students,
        "avg_progress": round(avg_progress, 1),
        "total_revenue": total_revenue
    }

# ==================== ADMIN DASHBOARD ROUTES ====================

@api_router.get("/admin/stats", response_model=PlatformStats)
async def get_platform_stats(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()
    
    # By role
    students_result = await db.execute(select(func.count(User.id)).where(User.role == UserRole.STUDENT))
    total_students = students_result.scalar()
    
    instructors_result = await db.execute(select(func.count(User.id)).where(User.role == UserRole.INSTRUCTOR))
    total_instructors = instructors_result.scalar()
    
    # Total courses
    courses_result = await db.execute(select(func.count(Course.id)))
    total_courses = courses_result.scalar()
    
    # Total enrollments
    enrollments_result = await db.execute(select(func.count(Enrollment.id)))
    total_enrollments = enrollments_result.scalar()
    
    # Total revenue
    revenue_result = await db.execute(
        select(func.sum(PaymentTransaction.amount)).where(PaymentTransaction.status == PaymentStatus.COMPLETED)
    )
    total_revenue = revenue_result.scalar() or 0
    
    return PlatformStats(
        total_users=total_users,
        total_students=total_students,
        total_instructors=total_instructors,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        total_revenue=total_revenue
    )

@api_router.get("/admin/users", response_model=List[UserAdminResponse])
async def get_all_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    
    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    response = []
    for user in users:
        courses_result = await db.execute(select(func.count(Course.id)).where(Course.instructor_id == user.id))
        courses_count = courses_result.scalar()
        
        enrollments_result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.student_id == user.id))
        enrollments_count = enrollments_result.scalar()
        
        response.append(UserAdminResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            courses_count=courses_count,
            enrollments_count=enrollments_count
        ))
    
    return response

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: UserRole,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    await db.commit()
    
    return {"message": "User role updated successfully"}

@api_router.get("/admin/courses", response_model=List[CourseResponse])
async def get_all_courses_admin(
    search: Optional[str] = None,
    is_published: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Course).options(selectinload(Course.instructor))
    
    if search:
        query = query.where(Course.title.ilike(f"%{search}%"))
    if is_published is not None:
        query = query.where(Course.is_published == is_published)
    
    query = query.order_by(Course.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    response = []
    for course in courses:
        lessons_result = await db.execute(select(func.count(Lesson.id)).where(Lesson.course_id == course.id))
        lessons_count = lessons_result.scalar()
        
        enrollments_result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id))
        students_count = enrollments_result.scalar()
        
        response.append(CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            cover_image=course.cover_image,
            category=course.category,
            level=course.level,
            price=course.price,
            is_free=course.is_free,
            is_published=course.is_published,
            instructor_id=course.instructor_id,
            instructor=InstructorResponse(
                id=course.instructor.id,
                full_name=course.instructor.full_name,
                avatar_url=course.instructor.avatar_url
            ) if course.instructor else None,
            lessons_count=lessons_count,
            students_count=students_count,
            created_at=course.created_at
        ))
    
    return response

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Lumina LMS API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
