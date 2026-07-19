import app from '../src/app.js';
import logger from '../src/logger/logger.js';

const PORT = 5002;
let server;

const makeRequest = async (path, method = 'GET', body = null, headers = {}) => {
  const url = `http://localhost:${PORT}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
};

const run = async () => {
  try {
    console.log('⏳ Starting complete DevBattles backend tests...');
    
    server = app.listen(PORT, () => {
      console.log(`🚀 Test server listening on port ${PORT}`);
    });

    // 1. GET /health
    const health = await makeRequest('/health');
    console.log('Health Check Status:', health.status);
    if (!health.data.success) throw new Error('Health check failed');

    // 2. Sign in users
    console.log('\n🔐 Testing Authentication...');
    const random = Date.now();
    
    const adminLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@devbattles.com',
      password: 'Password@123'
    });
    console.log('Admin Login status:', adminLogin.status);
    const adminToken = adminLogin.data.data.token;
    const adminAuth = { 'Authorization': `Bearer ${adminToken}` };

    const teacherLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'smith@devbattles.com',
      password: 'Password@123'
    });
    console.log('Teacher Login status:', teacherLogin.status);
    const teacherToken = teacherLogin.data.data.token;
    const teacherAuth = { 'Authorization': `Bearer ${teacherToken}` };

    const studentLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'alice@devbattles.com',
      password: 'Password@123'
    });
    console.log('Student Login status:', studentLogin.status);
    const studentToken = studentLogin.data.data.token;
    const studentAuth = { 'Authorization': `Bearer ${studentToken}` };

    // 3. Admin: Manage Colleges & Departments
    console.log('\n🏛️ Testing Admin Colleges & Departments...');
    const collegeRes = await makeRequest('/api/admin/colleges', 'POST', {
      name: `Oxford College ${random}`
    }, adminAuth);
    console.log('Create College Status:', collegeRes.status);
    const collegeId = collegeRes.data.data.id;

    const deptRes = await makeRequest('/api/admin/departments', 'POST', {
      collegeId,
      name: 'Computer Engineering'
    }, adminAuth);
    console.log('Create Department Status:', deptRes.status);

    const listRes = await makeRequest('/api/admin/colleges-departments', 'GET', null, adminAuth);
    console.log('Get Colleges & Depts Status:', listRes.status);

    // 4. Teacher: Create Question Bank entry
    console.log('\n📝 Testing Question Bank...');
    const questionRes = await makeRequest('/api/questions', 'POST', {
      title: 'JavaScript Reverse String',
      description: 'Write a function that reverses a given string.',
      difficulty: 'easy',
      estimatedTime: '15 mins',
      techStack: ['JavaScript'],
      tags: ['algorithms', 'strings'],
      requirements: ['Must handle empty inputs', 'O(N) runtime'],
      starterFiles: { 'index.js': { content: 'function reverse() {}' } },
      expectedOutput: 'gnirts'
    }, teacherAuth);
    console.log('Create Question Status:', questionRes.status, 'ID:', questionRes.data.data?.id);
    const questionId = questionRes.data.data.id;

    const updateRes = await makeRequest(`/api/questions/${questionId}`, 'PUT', {
      description: 'Write a function that reverses a given string. Code must handle emojis too.'
    }, teacherAuth);
    console.log('Update Question Status:', updateRes.status, 'New Version:', updateRes.data.data?.version);

    const pubRes = await makeRequest(`/api/questions/${questionId}/publish`, 'POST', {}, teacherAuth);
    console.log('Publish Question Status:', pubRes.status, 'Published:', pubRes.data.data?.published);

    // 5. Teacher: Create and Assign Homework
    console.log('\n📚 Testing Homework...');
    const hwRes = await makeRequest('/api/homework', 'POST', {
      title: 'JavaScript Algorithms HW',
      description: 'Submit your string reverse solutions.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      questions: [questionId]
    }, teacherAuth);
    console.log('Create Homework Status:', hwRes.status, 'ID:', hwRes.data.data?.id);
    const homeworkId = hwRes.data.data.id;

    const assignRes = await makeRequest(`/api/homework/${homeworkId}/assign`, 'POST', {
      studentId: studentLogin.data.data.user.id
    }, teacherAuth);
    console.log('Assign Homework Status:', assignRes.status);

    const assignedHwRes = await makeRequest('/api/homework/assigned', 'GET', null, studentAuth);
    console.log('Get Assigned Homeworks Status:', assignedHwRes.status, 'Count:', assignedHwRes.data.data?.length);

    const submitHwRes = await makeRequest(`/api/homework/${homeworkId}/submit`, 'POST', {
      questionId,
      questionVersion: 2,
      files: { 'index.js': { content: 'function reverse(str) { return str.split("").reverse().join(""); }' } },
      githubRepo: 'https://github.com/alice/reverse-str',
      livePreview: 'https://alice.demo.com'
    }, studentAuth);
    console.log('Submit Homework Status:', submitHwRes.status);
    console.log('AI Grade Received:', submitHwRes.data.data?.score, 'Grade:', submitHwRes.data.data?.grade);

    // 6. Contests
    console.log('\n🏆 Testing Contests...');
    const contestRes = await makeRequest('/api/contests', 'POST', {
      title: 'Algorithm Speed Contest',
      description: 'Solve the reverse string challenge in 10 minutes!',
      startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: 'started',
      questions: [{ questionId, order: 1, points: 100 }]
    }, teacherAuth);
    console.log('Create Contest Status:', contestRes.status, 'ID:', contestRes.data.data?.id);
    const contestId = contestRes.data.data.id;

    const joinRes = await makeRequest(`/api/contests/${contestId}/join`, 'POST', {}, studentAuth);
    console.log('Join Contest Status:', joinRes.status);

    const submitContestRes = await makeRequest(`/api/contests/${contestId}/questions/${questionId}/submit`, 'POST', {
      questionId,
      questionVersion: 2,
      files: { 'index.js': { content: 'function reverse(s) { return [...s].reverse().join(""); }' } }
    }, studentAuth);
    console.log('Submit Contest Answer Status:', submitContestRes.status);

    // 7. Leaderboards
    console.log('\n📊 Testing Leaderboards...');
    const leaderboardRes = await makeRequest('/api/leaderboards?type=global', 'GET', null, studentAuth);
    console.log('Get Global Leaderboard Status:', leaderboardRes.status, 'Top rank score:', leaderboardRes.data.data?.[0]?.score);

    // 8. Certificates
    console.log('\n📜 Testing Certificates...');
    const issueCertRes = await makeRequest('/api/certificates', 'POST', {
      userId: studentLogin.data.data.user.id,
      type: 'contest',
      title: 'Algorithm Speed Contest Certificate',
      description: 'Issued to student for solving string reversal.'
    }, teacherAuth);
    console.log('Issue Certificate Status:', issueCertRes.status, 'Code:', issueCertRes.data.data?.verificationCode);
    const verificationCode = issueCertRes.data.data.verificationCode;

    const listCertRes = await makeRequest('/api/certificates', 'GET', null, studentAuth);
    console.log('Student Certificates Status:', listCertRes.status, 'Count:', listCertRes.data.data?.length);

    const verifyCertRes = await makeRequest(`/api/certificates/verify/${verificationCode}`, 'GET');
    console.log('Public Verification Status:', verifyCertRes.status, 'Title:', verifyCertRes.data.data?.certificate?.title);

    // 9. Notifications
    console.log('\n🔔 Testing Notifications...');
    const notifRes = await makeRequest('/api/notifications', 'GET', null, studentAuth);
    console.log('Get Notifications Status:', notifRes.status, 'Count:', notifRes.data.data?.length);

    if (notifRes.data.data?.[0]) {
      const markReadRes = await makeRequest(`/api/notifications/${notifRes.data.data[0].id}/read`, 'PUT', {}, studentAuth);
      console.log('Mark Read Status:', markReadRes.status);
    }

    // 10. Dashboards
    console.log('\n📊 Testing Dashboards...');
    const studentDash = await makeRequest('/api/dashboard/student', 'GET', null, studentAuth);
    console.log('Student Dashboard Status:', studentDash.status, 'Unread Notifs:', studentDash.data.data?.unreadNotificationsCount);

    const teacherDash = await makeRequest('/api/dashboard/teacher', 'GET', null, teacherAuth);
    console.log('Teacher Dashboard Status:', teacherDash.status, 'Total Students:', teacherDash.data.data?.totalStudents);

    const adminDash = await makeRequest('/api/dashboard/admin', 'GET', null, adminAuth);
    console.log('Admin Dashboard Status:', adminDash.status, 'Pending Teachers Approval:', adminDash.data.data?.pendingTeachersApprovalCount);

    console.log('\n✅ All tests passed successfully!');
    server.close(() => {
      console.log('Test server shut down.');
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ Test run failed:', error);
    if (server) server.close();
    process.exit(1);
  }
};

run();
