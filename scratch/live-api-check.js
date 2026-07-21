async function check() {
  try {
    const res1 = await fetch('https://devbattleapi.duckdns.org/api/admin/colleges-departments');
    console.log('GET Colleges-departments status:', res1.status);
    console.log('GET Colleges-departments headers:', Object.fromEntries(res1.headers.entries()));
    const text1 = await res1.text();
    console.log('GET Colleges-departments response:', text1);
  } catch (err) {
    console.error('Error fetching colleges-departments:', err.message);
  }

  try {
    const res2 = await fetch('https://devbattleapi.duckdns.org/api/admin/colleges', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://devbattle-frontend-kappa.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    console.log('OPTIONS status:', res2.status);
    console.log('OPTIONS headers:', Object.fromEntries(res2.headers.entries()));
  } catch (err) {
    console.error('Error fetching OPTIONS:', err.message);
  }
}

check();
