const fetch = global.fetch || require('node-fetch');

async function run() {
  try {
    const login = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'testuser@example.com', password: 'testpass' })
    });
    const lr = await login.json();
    console.log('login:', lr);
    const token = lr.token;
    const w = await fetch('http://localhost:5000/api/workorders', { headers: { Authorization: `Bearer ${token}` } });
    const wr = await w.json();
    console.log('workorders count:', (wr.workOrders||[]).length);
  } catch (err) {
    console.error('error', err);
  }
}

run();
