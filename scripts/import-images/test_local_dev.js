async function main() {
  const url = 'http://localhost:3000/api/products/geforce-rtx-4060-8gb';
  console.log(`Fetching from local server: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch. Status: ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching:', error.message);
  }
}

main().catch(console.error);
