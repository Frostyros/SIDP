const { Client } = require('pg');

async function tryConnect(label, connStr) {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  try {
    console.log(`Trying ${label}...`);
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`SUCCESS with ${label}! Time: ${res.rows[0].now}`);
    await client.end();
    return true;
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function main() {
  const pw = '10Fros101296!';
  const pwEnc = '10Fros101296%21';
  const ref = 'oytibgoktenwvekhbznl';
  
  const urls = [
    ['Pooler session (postgres.ref)', `postgresql://postgres.${ref}:${pw}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`],
    ['Pooler txn (postgres.ref)', `postgresql://postgres.${ref}:${pw}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`],
    ['Pooler session (postgres only)', `postgresql://postgres:${pw}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`],
    ['Pooler txn (postgres only)', `postgresql://postgres:${pw}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`],
  ];
  
  for (const [label, url] of urls) {
    const ok = await tryConnect(label, url);
    if (ok) {
      console.log(`\nWORKING URL: ${url.replace(pw, '***')}`);
      break;
    }
  }
}

main();
