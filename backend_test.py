import requests
import sys
import json
from datetime import datetime

class AIFeatureAPITester:
    def __init__(self, base_url="https://academy-pro-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.course_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        if self.token:
            request_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            request_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if response_data:
                        print(f"   Response Keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'List with ' + str(len(response_data)) + ' items'}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Raw Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        success, _ = self.run_test("API Health Check", "GET", "/api/health", 200)
        return success

    def test_login(self):
        """Test login with instructor credentials"""
        success, response = self.run_test(
            "Instructor Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "instructor@test.com", "password": "test123456"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_ai_generate_course(self):
        """Test AI course generation endpoint"""
        success, response = self.run_test(
            "AI Generate Course",
            "POST",
            "/api/ai/generate-course",
            200,
            data={
                "topic": "Introducción a Python",
                "level": "beginner",
                "num_lessons": 5,
                "language": "es"
            }
        )
        
        if success:
            # Validate response structure
            required_fields = ['title', 'description', 'category', 'level', 'lessons']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in response: {field}")
                    return False
            
            if len(response['lessons']) != 5:
                print(f"❌ Expected 5 lessons, got {len(response['lessons'])}")
                return False
                
            # Check lesson structure
            lesson = response['lessons'][0]
            lesson_fields = ['title', 'description', 'content', 'lesson_type', 'duration_minutes']
            for field in lesson_fields:
                if field not in lesson:
                    print(f"❌ Missing field in lesson: {field}")
                    return False
            
            print(f"   ✅ Generated course: {response['title']}")
            print(f"   ✅ Lessons: {len(response['lessons'])}")
            return True
        return False

    def test_create_course_from_generated(self):
        """Test creating course from AI generated data"""
        # First generate a course
        success, ai_course = self.run_test(
            "AI Generate Course for Creation",
            "POST",
            "/api/ai/generate-course",
            200,
            data={
                "topic": "Diseño Web Básico",
                "level": "beginner",
                "num_lessons": 3,
                "language": "es"
            }
        )
        
        if not success:
            return False
            
        # Now create course from generated data
        success, response = self.run_test(
            "Create Course from AI Generated",
            "POST",
            "/api/ai/create-course-from-generated",
            200,
            data=ai_course
        )
        
        if success and 'course_id' in response:
            self.course_id = response['course_id']
            print(f"   ✅ Course created with ID: {self.course_id}")
            return True
        return False

    def test_ai_generate_quiz(self):
        """Test AI quiz generation endpoint"""
        if not self.course_id:
            # Create a simple course first
            course_success, course_response = self.run_test(
                "Create Test Course",
                "POST",
                "/api/courses",
                200,
                data={
                    "title": "Test Course for Quiz",
                    "description": "Test course description",
                    "level": "beginner",
                    "is_free": True
                }
            )
            if course_success:
                self.course_id = course_response['id']
            else:
                return False
        
        success, response = self.run_test(
            "AI Generate Quiz",
            "POST",
            "/api/ai/generate-quiz",
            200,
            data={
                "course_id": self.course_id,
                "topic": "Conceptos básicos",
                "num_questions": 5,
                "language": "es"
            }
        )
        
        if success:
            # Validate response structure
            required_fields = ['title', 'description', 'questions']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in response: {field}")
                    return False
            
            if len(response['questions']) != 5:
                print(f"❌ Expected 5 questions, got {len(response['questions'])}")
                return False
                
            # Check question structure
            question = response['questions'][0]
            question_fields = ['question_text', 'options', 'correct_option']
            for field in question_fields:
                if field not in question:
                    print(f"❌ Missing field in question: {field}")
                    return False
            
            if len(question['options']) != 4:
                print(f"❌ Expected 4 options, got {len(question['options'])}")
                return False
                
            print(f"   ✅ Generated quiz: {response['title']}")
            print(f"   ✅ Questions: {len(response['questions'])}")
            return True
        return False

    def test_create_quiz_from_generated(self):
        """Test creating quiz from AI generated data"""
        if not self.course_id:
            print("❌ No course ID available for quiz creation")
            return False
            
        # First generate a quiz
        success, ai_quiz = self.run_test(
            "AI Generate Quiz for Creation",
            "POST",
            "/api/ai/generate-quiz",
            200,
            data={
                "course_id": self.course_id,
                "num_questions": 3,
                "language": "es"
            }
        )
        
        if not success:
            return False
            
        # Now create quiz from generated data
        success, response = self.run_test(
            "Create Quiz from AI Generated",
            "POST",
            f"/api/ai/create-quiz-from-generated?course_id={self.course_id}",
            200,
            data=ai_quiz
        )
        
        if success and 'quiz_id' in response:
            print(f"   ✅ Quiz created with ID: {response['quiz_id']}")
            return True
        return False

    def test_instructor_dashboard_endpoints(self):
        """Test instructor dashboard related endpoints"""
        success, response = self.run_test(
            "Get Instructor Courses",
            "GET",
            "/api/instructor/courses",
            200
        )
        
        if success:
            print(f"   ✅ Found {len(response)} instructor courses")
            return True
        return False

    def test_error_cases(self):
        """Test error handling scenarios"""
        # Test without authentication
        temp_token = self.token
        self.token = None
        
        success, _ = self.run_test(
            "AI Generate Course (Unauthorized)",
            "POST",
            "/api/ai/generate-course",
            401,
            data={"topic": "Test", "level": "beginner"}
        )
        
        # Restore token
        self.token = temp_token
        
        if not success:
            print("❌ Should have returned 401 for unauthorized request")
            return False
        
        # Test invalid course ID for quiz
        success, _ = self.run_test(
            "AI Generate Quiz (Invalid Course)",
            "POST",
            "/api/ai/generate-quiz",
            404,
            data={
                "course_id": "invalid-course-id",
                "num_questions": 5
            }
        )
        
        if not success:
            print("❌ Should have returned 404 for invalid course")
            return False
            
        print("✅ Error handling tests passed")
        return True

def main():
    print("🚀 Starting AI Feature API Tests...")
    print("=" * 50)
    
    tester = AIFeatureAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Login", tester.test_login),
        ("AI Generate Course", tester.test_ai_generate_course),
        ("Create Course from Generated", tester.test_create_course_from_generated),
        ("AI Generate Quiz", tester.test_ai_generate_quiz),
        ("Create Quiz from Generated", tester.test_create_quiz_from_generated),
        ("Instructor Dashboard", tester.test_instructor_dashboard_endpoints),
        ("Error Handling", tester.test_error_cases)
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 30)
        try:
            success = test_func()
            if not success:
                print(f"❌ {test_name} failed - stopping critical path tests")
                if test_name in ["Health Check", "Login"]:
                    break
        except Exception as e:
            print(f"❌ {test_name} crashed: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())