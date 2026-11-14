async function main() {
  const base = 'http://localhost:3000/api/auth';
  const headers = { 'Content-Type': 'application/json' };

  const reg = await fetch(`${base}/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Ahmed',
      email: 'a@test.com',
      phone: '0599000000',
      password: '123456',
    }),
  });
  console.log('REGISTER:', reg.status, await reg.json());

  const bad = await fetch(`${base}/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'a@test.com', password: 'wrong' }),
  });
  console.log('LOGIN (wrong password):', bad.status, await bad.json());

  const ok = await fetch(`${base}/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'a@test.com', password: '123456' }),
  });
  console.log('LOGIN (correct):', ok.status, await ok.json());
}

main();