const fs = require('fs');

async function main() {
  const url = 'https://jozbxiwavhmxuwhkuhwm.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvemJ4aXdhdmhteHV3aGt1aHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjM4OTAsImV4cCI6MjA5OTA5OTg5MH0.jdKGxhJZtN-r_S8g0l40f2dWIp15eKa8QjDqSPVtsPU';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(Object.keys(data.paths), null, 2));
    
    // Also save the full swagger spec for reference
    fs.writeFileSync('swagger.json', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching swagger:', err);
  }
}

main();
