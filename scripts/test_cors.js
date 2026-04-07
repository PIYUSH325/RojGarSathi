(async () => {
  try {
    const res = await fetch('http://localhost:5000/', { method: 'GET', headers: { 'Origin': 'http://localhost:3000' } });
    console.log('STATUS', res.status);
    console.log('HEADERS', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    console.log('BODY', await res.text());
  } catch (e) {
    console.error('ERR', e.message);
  }
})();
