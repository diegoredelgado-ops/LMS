import requests
import sys
import json
from datetime import datetime

class LMSAPITester:
    def __init__(self):
        # Use the public endpoint from frontend .env
        self.base_url = "https://plataforma-educativa-1.preview.emergentagent.com/api"
        self.instructor_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        
        # Prepare headers
        test_headers = {'Content-Type': 'application/json'}
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                    # Debug: Print response keys for login/register
                    if '/auth/' in endpoint and response_data:
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}
    
    def test_health_check(self):
        """Test API health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH CHECKS")
        print("="*50)
        
        success1, _ = self.run_test("API Root", "GET", "/", 200)
        success2, _ = self.run_test("Health Check", "GET", "/health", 200)
        
        return success1 and success2
    
    def test_user_registration(self):
        """Test user registration for both roles"""
        print("\n" + "="*50)
        print("TESTING USER REGISTRATION")
        print("="*50)
        
        # Use unique emails with timestamp to avoid conflicts
        timestamp = str(int(datetime.now().timestamp()))
        
        # Test student registration
        student_data = {
            "email": f"student{timestamp}@test.com",
            "password": "test123456",
            "full_name": "Test Student",
            "role": "student"
        }
        
        success1, response1 = self.run_test(
            "Student Registration",
            "POST",
            "/auth/register",
            200,
            data=student_data
        )
        
        if success1 and 'access_token' in response1:
            self.student_token = response1['access_token']
            self.student_email = student_data['email']
            print(f"   Student token obtained: {self.student_token[:20]}...")
        
        # Test instructor registration
        instructor_data = {
            "email": f"instructor{timestamp}@test.com",
            "password": "test123456",
            "full_name": "Test Instructor",
            "role": "instructor"
        }
        
        success2, response2 = self.run_test(
            "Instructor Registration",
            "POST",
            "/auth/register",
            200,
            data=instructor_data
        )
        
        if success2 and 'access_token' in response2:
            self.instructor_token = response2['access_token']
            self.instructor_email = instructor_data['email']
            print(f"   Instructor token obtained: {self.instructor_token[:20]}...")
        
        return success1 and success2
    
    def test_user_login(self):
        """Test user login"""
        print("\n" + "="*50)
        print("TESTING USER LOGIN")
        print("="*50)
        
        # Try to login with existing test credentials first
        existing_student_login = {
            "email": "student@test.com",
            "password": "test123456"
        }
        
        success1, response1 = self.run_test(
            "Existing Student Login",
            "POST",
            "/auth/login",
            200,
            data=existing_student_login
        )
        
        if success1 and 'access_token' in response1:
            self.student_token = response1['access_token']
            print(f"   Student token obtained: {self.student_token[:20]}...")
        
        # Try to login with existing instructor credentials
        existing_instructor_login = {
            "email": "instructor@test.com",
            "password": "test123456"
        }
        
        success2, response2 = self.run_test(
            "Existing Instructor Login",
            "POST",
            "/auth/login",
            200,
            data=existing_instructor_login
        )
        
        if success2 and 'access_token' in response2:
            self.instructor_token = response2['access_token']
            print(f"   Instructor token obtained: {self.instructor_token[:20]}...")
        
        return success1 and success2
    
    def test_auth_me(self):
        """Test authenticated user info"""
        print("\n" + "="*50)
        print("TESTING AUTH ME ENDPOINT")
        print("="*50)
        
        success1, response1 = self.run_test(
            "Student Auth Me",
            "GET",
            "/auth/me",
            200,
            token=self.student_token
        )
        
        success2, response2 = self.run_test(
            "Instructor Auth Me",
            "GET",
            "/auth/me",
            200,
            token=self.instructor_token
        )
        
        return success1 and success2
    
    def test_courses_list(self):
        """Test courses listing"""
        print("\n" + "="*50)
        print("TESTING COURSE LISTING")
        print("="*50)
        
        success1, response1 = self.run_test(
            "List Courses (Public)",
            "GET",
            "/courses",
            200
        )
        
        success2, _ = self.run_test(
            "Get Course Categories",
            "GET",
            "/courses/categories",
            200
        )
        
        return success1 and success2
    
    def test_course_creation(self):
        """Test course creation by instructor"""
        print("\n" + "="*50)
        print("TESTING COURSE CREATION")
        print("="*50)
        
        if not self.instructor_token:
            print("❌ No instructor token available")
            return False
        
        course_data = {
            "title": "Test Course",
            "description": "A test course for API testing",
            "category": "Programming",
            "level": "beginner",
            "price": 0.0,
            "is_free": True
        }
        
        success, response = self.run_test(
            "Create Course",
            "POST",
            "/courses",
            200,
            data=course_data,
            token=self.instructor_token
        )
        
        if success and 'id' in response:
            self.course_id = response['id']
            print(f"   Course created with ID: {self.course_id}")
            
            # Test getting the created course
            success2, _ = self.run_test(
                "Get Created Course",
                "GET",
                f"/courses/{self.course_id}",
                200
            )
            
            return success and success2
        
        return success
    
    def test_course_enrollment(self):
        """Test course enrollment"""
        print("\n" + "="*50)
        print("TESTING COURSE ENROLLMENT")
        print("="*50)
        
        if not hasattr(self, 'course_id') or not self.student_token:
            print("❌ No course ID or student token available")
            return False
        
        success1, _ = self.run_test(
            "Enroll in Course",
            "POST",
            f"/courses/{self.course_id}/enroll",
            200,
            token=self.student_token
        )
        
        success2, _ = self.run_test(
            "Get My Enrollments",
            "GET",
            "/enrollments",
            200,
            token=self.student_token
        )
        
        return success1 and success2
    
    def test_instructor_dashboard(self):
        """Test instructor dashboard endpoints"""
        print("\n" + "="*50)
        print("TESTING INSTRUCTOR DASHBOARD")
        print("="*50)
        
        if not self.instructor_token:
            print("❌ No instructor token available")
            return False
        
        success1, _ = self.run_test(
            "Get Instructor Courses",
            "GET",
            "/instructor/courses",
            200,
            token=self.instructor_token
        )
        
        success2, _ = self.run_test(
            "Get Instructor Stats",
            "GET",
            "/instructor/stats",
            200,
            token=self.instructor_token
        )
        
        return success1 and success2
    
    def test_unauthorized_access(self):
        """Test unauthorized access scenarios"""
        print("\n" + "="*50)
        print("TESTING UNAUTHORIZED ACCESS")
        print("="*50)
        
        # Test accessing protected endpoints without auth
        success1, _ = self.run_test(
            "Auth Me Without Token",
            "GET",
            "/auth/me",
            401
        )
        
        success2, _ = self.run_test(
            "Create Course Without Token",
            "POST",
            "/courses",
            401,
            data={"title": "Test"}
        )
        
        # Test student accessing instructor endpoints
        success3, _ = self.run_test(
            "Student Access Instructor Endpoint",
            "GET",
            "/instructor/courses",
            403,
            token=self.student_token
        )
        
        return success1 and success2 and success3
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting LMS API Tests")
        print(f"   Base URL: {self.base_url}")
        
        # Test sequence
        test_results = []
        
        test_results.append(self.test_health_check())
        test_results.append(self.test_user_registration())
        test_results.append(self.test_user_login())
        test_results.append(self.test_auth_me())
        test_results.append(self.test_courses_list())
        test_results.append(self.test_course_creation())
        test_results.append(self.test_course_enrollment())
        test_results.append(self.test_instructor_dashboard())
        test_results.append(self.test_unauthorized_access())
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"   {i}. {failure['name']}")
                if 'expected' in failure:
                    print(f"      Expected: {failure['expected']}, Got: {failure['actual']}")
                if 'error' in failure:
                    print(f"      Error: {failure['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LMSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())