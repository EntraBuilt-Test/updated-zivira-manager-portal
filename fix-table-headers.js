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
    
    // Remove opacity modifiers from specific classes
    content = content.replace(/dark:bg-slate-900\/(80|90|95)/g, 'dark:bg-slate-900');
    content = content.replace(/dark:bg-slate-800\/(50|80|90|95)/g, 'dark:bg-slate-800');
    content = content.replace(/bg-slate-50\/(50|80|90)/g, 'bg-slate-50');
    
    // Make sure sticky columns match the row background exactly
    content = content.replace(/bg-slate-50 dark:bg-slate-900 backdrop-blur-sm/g, 'bg-slate-50 dark:bg-slate-900');
    
    // Specifically fix any lingering mismatched classes in tr or th
    content = content.replace(/dark:bg-slate-900 dark:bg-slate-900\/[0-9]+/g, 'dark:bg-slate-900');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed table headers in ${file}`);
    }
  }
}
