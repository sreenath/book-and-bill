import fs from 'fs';

const filePath = 'c:/PythonProjects/book-and-bill/node_modules/@google/adk-devtools/dist/cli/cli.cjs';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const target = 'r.endsWith(".js")&&s.setHeader("Content-Type","text/javascript")';
const replacement = 's.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate"),r.endsWith(".js")&&s.setHeader("Content-Type","text/javascript")';

if (content.includes(target)) {
  console.log('Target string found in cli.cjs! Replacing...');
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched cli.cjs!');
} else {
  console.error('Target string NOT found in cli.cjs!');
}
