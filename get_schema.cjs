const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.jozbxiwavhmxuwhkuhwm:ArenaGo!123kaspun@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);
  
  const schema = {};
  for (const row of res.rows) {
    if (!schema[row.table_name]) {
      schema[row.table_name] = [];
    }
    schema[row.table_name].push({ column: row.column_name, type: row.data_type });
  }
  
  console.log(JSON.stringify(schema, null, 2));
  await client.end();
}

main().catch(console.error);
