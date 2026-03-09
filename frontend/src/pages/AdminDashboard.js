import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  DollarSign,
  BarChart3,
  Search,
  Shield,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { api, user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab, roleFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'overview' || activeTab === 'users') {
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data);
      }
      
      if (activeTab === 'users') {
        const params = new URLSearchParams();
        if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
        if (searchQuery) params.append('search', searchQuery);
        
        const usersRes = await api.get(`/admin/users?${params.toString()}`);
        setUsers(usersRes.data);
      }
      
      if (activeTab === 'courses') {
        const coursesRes = await api.get('/admin/courses');
        setCourses(coursesRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`);
      toast.success('User role updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-xl font-heading font-bold">Lumina</span>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-overview"
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-users"
            >
              <Users className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'courses' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-courses"
            >
              <BookOpen className="w-5 h-5" />
              Courses
            </button>
            <Link
              to="/instructor"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              data-testid="nav-instructor"
            >
              <Shield className="w-5 h-5" />
              Instructor Panel
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              data-testid="nav-profile"
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Admin')}&background=6366f1&color=fff`}
              alt={user?.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.full_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, courses, and platform settings</p>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total_users}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
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
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total_courses}</p>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
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
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${stats.total_revenue}</p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6"
                >
                  <h3 className="font-semibold mb-4">User Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-medium">{stats.total_students}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Instructors</span>
                      <span className="font-medium">{stats.total_instructors}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Enrollments</span>
                      <span className="font-medium">{stats.total_enrollments}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    className="pl-10"
                    data-testid="user-search"
                  />
                </div>
                <Select value={roleFilter || 'all'} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="role-filter">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="instructor">Instructors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="p-4 font-medium text-muted-foreground">User</th>
                        <th className="p-4 font-medium text-muted-foreground">Email</th>
                        <th className="p-4 font-medium text-muted-foreground">Role</th>
                        <th className="p-4 font-medium text-muted-foreground">Courses</th>
                        <th className="p-4 font-medium text-muted-foreground">Enrollments</th>
                        <th className="p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=6366f1&color=fff`}
                                alt={u.full_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span className="font-medium">{u.full_name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4">
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-4">{u.courses_count}</td>
                          <td className="p-4">{u.enrollments_count}</td>
                          <td className="p-4">
                            <Select
                              value={u.role}
                              onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                              disabled={u.id === user?.id}
                            >
                              <SelectTrigger className="w-[130px]" data-testid={`change-role-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="p-4 font-medium text-muted-foreground">Course</th>
                        <th className="p-4 font-medium text-muted-foreground">Instructor</th>
                        <th className="p-4 font-medium text-muted-foreground">Status</th>
                        <th className="p-4 font-medium text-muted-foreground">Lessons</th>
                        <th className="p-4 font-medium text-muted-foreground">Students</th>
                        <th className="p-4 font-medium text-muted-foreground">Price</th>
                        <th className="p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={course.cover_image || 'https://images.unsplash.com/photo-1513746199652-7a5904642685?w=100'}
                                alt={course.title}
                                className="w-12 h-8 rounded object-cover"
                              />
                              <span className="font-medium truncate max-w-[200px]">{course.title}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {course.instructor?.full_name || 'Unknown'}
                          </td>
                          <td className="p-4">
                            <Badge variant={course.is_published ? 'default' : 'secondary'}>
                              {course.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </td>
                          <td className="p-4">{course.lessons_count}</td>
                          <td className="p-4">{course.students_count}</td>
                          <td className="p-4">{course.is_free ? 'Free' : `$${course.price}`}</td>
                          <td className="p-4">
                            <Link to={`/courses/${course.id}/edit`}>
                              <Button variant="outline" size="sm" data-testid={`edit-${course.id}`}>
                                Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
