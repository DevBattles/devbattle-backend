async function check() {
  try {
    const res = await fetch('https://devbattleapi.duckdns.org/api/users/me');
    console.log('Users/me status:', res.status);
    console.log('Users/me headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Users/me response:', text);
  } catch (err) {
    console.error('Error fetching users/me:', err.message);
  }
}

check();
