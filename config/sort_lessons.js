const fs = require('fs');
const content = fs.readFileSync('data/cannabisUniversity.ts', 'utf8');

const start = content.indexOf('export const LESSONS: Lesson[] = [');
const arrayStart = content.indexOf('[', start);

// Find the matching closing bracket for the array
let braceDepth = 0;
let inString = false;
let quoteChar = '';
let end = arrayStart;

for (let i = arrayStart; i < content.length; i++) {
  const ch = content[i];
  
  if (inString) {
    if (ch === '\\') { i++; continue; }
    if (ch === quoteChar) inString = false;
    continue;
  }
  
  if (ch === "'" || ch === '"' || ch === '`') { inString = true; quoteChar = ch; continue; }
  
  if (ch === '{') braceDepth++;
  if (ch === '}') braceDepth--;
  if (ch === '[') braceDepth++;
  if (ch === ']') {
    braceDepth--;
    if (braceDepth === 0) { end = i + 1; break; }
  }
}

const lessonsText = content.substring(arrayStart, end);

// Parse out individual lesson objects
let lessons = [];
let depth = 0;
let current = '';
let inStr2 = false;
let quoteChar2 = '';

for (let i = 0; i < lessonsText.length; i++) {
  const ch = lessonsText[i];
  
  if (inStr2) {
    current += ch;
    if (ch === '\\') { i++; current += lessonsText[i] || ''; continue; }
    if (ch === quoteChar2) inStr2 = false;
    continue;
  }
  
  if (ch === "'" || ch === '"' || ch === '`') { inStr2 = true; quoteChar2 = ch; current += ch; continue; }
  
  if (ch === '{') { depth++; current += ch; continue; }
  if (ch === '}') { depth--; current += ch; continue; }
  if (ch === '[') { depth++; current += ch; continue; }
  if (ch === ']') { depth--; current += ch; continue; }
  
  if (ch === ',' && depth === 0) {
    const trimmed = current.trim();
    if (trimmed.length > 5) lessons.push(trimmed);
    current = '';
    continue;
  }
  
  current += ch;
}

const trimmed = current.trim();
if (trimmed.length > 5) {
  const clean = trimmed.replace(/\]\s*$/, '').trim();
  if (clean.startsWith('{')) lessons.push(clean);
}

// Get level value from a lesson string
function getLevelVal(lesson) {
  if (lesson.includes("'Beginner'")) return 0;
  if (lesson.includes("'Intermediate'")) return 1;
  if (lesson.includes("'Advanced'")) return 2;
  return 3;
}

lessons.sort((a, b) => getLevelVal(a) - getLevelVal(b));

const header = `import { Lesson, UniversityCategory } from '../types';\n\nexport const UNIVERSITY_CATEGORIES: UniversityCategory[] = [\n  { id: 'basics', title: 'Basics', description: 'Fundamentals of the plant.', icon: 'Leaf' },\n  { id: 'products', title: 'Product Guide', description: 'Explore flower, vapes, and more.', icon: 'Package' },\n  { id: 'buying', title: 'Buying Guide', description: 'How to shop successfully.', icon: 'ShoppingCart' },\n  { id: 'consumption', title: 'Consumption', description: 'Methods of use.', icon: 'Wind' },\n  { id: 'safety', title: 'Effects & Safety', description: 'Safe usage patterns.', icon: 'ShieldCheck' },\n  { id: 'science', title: 'Science', description: 'Terpenes and cannabinoids.', icon: 'Beaker' },\n  { id: 'growing', title: 'Growing Basics', description: 'Cultivation fundamentals.', icon: 'Sprout' },\n  { id: 'edibles', title: 'Edibles', description: 'Infusion knowledge.', icon: 'Cookie' },\n];\n\nexport const LESSONS: Lesson[] = [\n`;

// Build sorted lessons
const sorted = lessons.join(',\n\n');

const result = header + sorted + '\n];\n';

fs.writeFileSync('data/cannabisUniversity.ts', result);
console.log('Sorted ' + lessons.length + ' lessons by level.');
console.log('Count by level:');
const b = lessons.filter(l => l.includes("'Beginner'")).length;
const i = lessons.filter(l => l.includes("'Intermediate'")).length;
const a = lessons.filter(l => l.includes("'Advanced'")).length;
console.log('  Beginner: ' + b);
console.log('  Intermediate: ' + i);
console.log('  Advanced: ' + a);