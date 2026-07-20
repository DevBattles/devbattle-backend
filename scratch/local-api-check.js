async function check() {
  try {
    const res1 = await fetch('http://localhost:5000/api/admin/colleges-departments', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173', // typical local Vite frontend port
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    console.log('Local OPTIONS status:', res1.status);
    console.log('Local OPTIONS headers:', Object.fromEntries(res1.headers.entries()));
  } catch (err) {
    console.error('Error fetching local OPTIONS:', err.message);
  }

  try {
    // Note: since /api/admin is protected, GET /api/admin/colleges-departments should return 401 without auth header
    const res2 = await fetch('http://localhost:5000/api/admin/colleges-departments');
    console.log('Local GET status:', res2.status);
    console.log('Local GET headers:', Object.fromEntries(res2.headers.entries()));
    const data = await res2.json();
    console.log('Local GET response:', data);
  } catch (err) {
    console.error('Error fetching local GET:', err.message);
  }
}

check();
