import('../src/services/recommendationEngine.ts').then(m => {
  const r = m.runEngineSelfTest();
  console.log('PASSED:', r.passed, 'FAILED:', r.failed);
  if (r.errors.length) r.errors.forEach(e => console.log(' - ' + e));
  process.exit(r.failed ? 1 : 0);
}).catch(e => { console.error(e); process.exit(2); });
