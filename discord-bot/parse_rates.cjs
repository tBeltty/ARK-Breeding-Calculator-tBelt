
const fs = require('fs');
const html = fs.readFileSync('rates_page.html', 'utf8');

// Match pattern: <h4 ...>Name</h4> ... <div ...>Value</div>
// We'll use a broad regex to catch all cards
const regex = /<h4[^>]*>([^<]+)<\/h4>[\s\S]*?<div[^>]*class="rate-value[^"]*"[^>]*>\s*([\d.]+)x/g;

let match;
console.log("--- FOUND RATES ---");
while ((match = regex.exec(html)) !== null) {
    console.log(`Label: "${match[1].trim()}" | Value: ${match[2]}`);
}
