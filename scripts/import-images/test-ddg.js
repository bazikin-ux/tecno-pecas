const query = 'GeForce RTX 4070 Super 12GB';

async function testSearch() {
  console.log(`Searching for: ${query}`);
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // 1. Get VQD token
  const initialUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  const initRes = await fetch(initialUrl, {
    headers: { 'User-Agent': userAgent }
  });
  const html = await initRes.text();
  
  // Extract vqd token using regex
  const vqdMatch = html.match(/vqd=([^&'"]+)/) || html.match(/vqd\s*=\s*['"]([^'"]+)['"]/);
  if (!vqdMatch) {
    console.error('Failed to find VQD token in HTML. Response preview:');
    console.log(html.substring(0, 500));
    return;
  }
  const vqd = vqdMatch[1];
  console.log('Found VQD:', vqd);

  // 2. Fetch images JSON
  const imagesUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
  const imgRes = await fetch(imagesUrl, {
    headers: {
      'User-Agent': userAgent,
      'Referer': 'https://duckduckgo.com/'
    }
  });
  const data = await imgRes.json();
  
  if (!data.results || data.results.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`Found ${data.results.length} images:`);
  data.results.slice(0, 5).forEach((r, idx) => {
    console.log(`[${idx}] Image: ${r.image}`);
    console.log(`    Title: ${r.title}`);
    console.log(`    Source: ${r.source}`);
  });
}

testSearch().catch(console.error);
