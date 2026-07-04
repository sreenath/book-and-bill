import fs from 'fs';

const filePath = 'c:/PythonProjects/book-and-bill/node_modules/@google/adk-devtools/dist/browser/index.html';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const target = 'src="./main-W7QZBYAR.js"';
const replacement = 'src="./main-W7QZBYAR.js?v=2"';

if (content.includes(target)) {
  console.log('Target string found in index.html! Replacing...');
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched index.html!');
} else {
  console.error('Target string NOT found in index.html!');
}
