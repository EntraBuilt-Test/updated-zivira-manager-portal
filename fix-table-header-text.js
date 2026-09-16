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
    
    // Replace dark:text-slate-400 with dark:text-white inside <tr> elements that have 'uppercase' (typical table headers)
    content = content.replace(/(<tr[^>]*uppercase[^>]*?)dark:text-slate-400/g, '$1dark:text-white');
    // Just in case it's text-slate-500 without dark variant in some place
    content = content.replace(/(<tr[^>]*uppercase[^>]*?)text-slate-500(?! dark:text-white)/g, '$1text-slate-500 dark:text-white');
    content = content.replace(/(<tr[^>]*uppercase[^>]*?)text-slate-600(?! dark:text-white)/g, '$1text-slate-600 dark:text-white');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated table header text in ${file}`);
    }
  }
}
