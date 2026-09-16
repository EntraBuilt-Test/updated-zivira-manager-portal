const fs = require('fs');
const path = require('path');

const files = [
  'components/manager-dcr-list.tsx'
];

const replacements = [
  { regex: /(?<![:A-Za-z0-9-])bg-white\b(?! dark:bg-slate-900)/g, replace: 'bg-white dark:bg-slate-900' },
  { regex: /(?<![:A-Za-z0-9-])bg-slate-50\b(?! dark:bg-slate-900)/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { regex: /(?<![:A-Za-z0-9-])bg-slate-100\b(?! dark:bg-slate-800)/g, replace: 'bg-slate-100 dark:bg-slate-800' },
  { regex: /(?<![:A-Za-z0-9-])border-slate-100\b(?! dark:border-slate-800)/g, replace: 'border-slate-100 dark:border-slate-800' },
  { regex: /(?<![:A-Za-z0-9-])border-slate-200\b(?! dark:border-slate-800)/g, replace: 'border-slate-200 dark:border-slate-800' },
  { regex: /(?<![:A-Za-z0-9-])border-slate-300\b(?! dark:border-slate-700)/g, replace: 'border-slate-300 dark:border-slate-700' },
  { regex: /(?<![:A-Za-z0-9-])text-slate-900\b(?! dark:text-white)/g, replace: 'text-slate-900 dark:text-white' },
  { regex: /(?<![:A-Za-z0-9-])text-slate-800\b(?! dark:text-slate-200)/g, replace: 'text-slate-800 dark:text-slate-200' },
  { regex: /(?<![:A-Za-z0-9-])text-slate-700\b(?! dark:text-slate-300)/g, replace: 'text-slate-700 dark:text-slate-300' },
  { regex: /(?<![:A-Za-z0-9-])text-slate-600\b(?! dark:text-slate-400)/g, replace: 'text-slate-600 dark:text-slate-400' },
  { regex: /(?<![:A-Za-z0-9-])text-slate-500\b(?! dark:text-slate-400)/g, replace: 'text-slate-500 dark:text-slate-400' },
  
  // Hover states
  { regex: /(?<![:A-Za-z0-9-])hover:bg-slate-50\b(?! dark:hover:bg-slate-800)/g, replace: 'hover:bg-slate-50 dark:hover:bg-slate-800' },
  { regex: /(?<![:A-Za-z0-9-])hover:bg-slate-100\b(?! dark:hover:bg-slate-800)/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { regex: /(?<![:A-Za-z0-9-])hover:text-slate-900\b(?! dark:hover:text-white)/g, replace: 'hover:text-slate-900 dark:hover:text-white' },
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const rule of replacements) {
      content = content.replace(rule.regex, rule.replace);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No changes needed for ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
}
