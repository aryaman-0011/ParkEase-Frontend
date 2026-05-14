const fs = require('fs');
const path = require('path');

const apiUrl = (process.env.NG_APP_API_URL || process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
const outputDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(outputDir, 'env.js');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputFile,
  `window.__env = {\n  apiUrl: ${JSON.stringify(apiUrl)},\n};\n`,
);

console.log(`Wrote ${outputFile} with apiUrl=${apiUrl}`);
