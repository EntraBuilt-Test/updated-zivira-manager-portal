const fs = require('fs');
const path = require('path');

const files = [
  'components/manager-expense-claims.tsx',
  'components/manager-visit-coverage.tsx',
  'components/manager-compliance.tsx',
  'components/manager-rep-analysis.tsx',
  'components/manager-tour-plans.tsx',
  'components/manager-dcr-list.tsx',
  'components/manager-dashboard.tsx',
  'components/manager-leave-requests.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Using a function to replace within <tr ...>
    content = content.replace(/<tr([^>]*)>/g, (match, p1) => {
      // If it looks like a header row (has uppercase or text-[11px])
      if (p1.includes('uppercase') || p1.includes('text-[11px]')) {
        let newP1 = p1;
        newP1 = newP1.replace(/dark:text-slate-400/g, 'dark:text-white');
        newP1 = newP1.replace(/text-slate-500(?! dark:text-white)/g, 'text-slate-500 dark:text-white');
        newP1 = newP1.replace(/text-slate-600(?! dark:text-white)/g, 'text-slate-600 dark:text-white');
        return `<tr${newP1}>`;
      }
      return match;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated table header text in ${file}`);
    }
  }
}
