import fs from 'fs';
import path from 'path';

const filePath = 'c:/PythonProjects/book-and-bill/node_modules/@google/adk-devtools/dist/browser/main-W7QZBYAR.js';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const target = 'createSession(){this.sessionService.createSession(this.userId,this.appName).subscribe(e=>{this.currentSessionState=e.state,this.sessionId=e.id,this.sessionTab.refreshSession(),this.isSessionUrlEnabledObs.subscribe(A=>{A&&this.updateSelectedSessionUrl()})})}';
const replacement = 'createSession(){this.sessionService.createSession(this.userId,this.appName).subscribe(e=>{this.updateWithSelectedSession(e),this.sessionTab.refreshSession()})}';

if (content.includes(target)) {
  console.log('Target string found in main-W7QZBYAR.js! Replacing...');
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched main-W7QZBYAR.js!');
} else {
  console.error('Target string NOT found in main-W7QZBYAR.js!');
  // Let's search with a slightly looser regex to see if it's there with minor formatting differences
  const looseRegex = /createSession\(\)\{this\.sessionService\.createSession\([^)]+\)\.subscribe\(e=>\{this\.currentSessionState=e\.state,this\.sessionId=e\.id,this\.sessionTab\.refreshSession\(\),this\.isSessionUrlEnabledObs\.subscribe\(A=>\{A&&this\.updateSelectedSessionUrl\(\)\}\)\}\)\}/;
  if (looseRegex.test(content)) {
    console.log('Loose match found! Replacing using regex...');
    content = content.replace(looseRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched main-W7QZBYAR.js using regex!');
  } else {
    console.error('Could not find any match.');
  }
}
