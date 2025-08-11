const fs = require('fs');
const path = require('path');
const archieml = require('archieml');

const CWD = process.cwd();
const INPUT_FILE = path.join(CWD, 'static', 'doc.txt');
const OUTPUT_FILE = path.join(CWD, 'static', 'doc.json');

try {
  const rawText = fs.readFileSync(INPUT_FILE, 'utf-8');
  const parsed = archieml.load(rawText);
  const jsonStr = JSON.stringify(parsed, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonStr, 'utf-8');
  console.log(`Parsed and saved to ${OUTPUT_FILE}`);
} catch (err) {
  console.error('Error:', err.message);
}
