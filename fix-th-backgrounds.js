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
    
    // Remove bg-slate-50 dark:bg-slate-900 from <tr>
    content = content.replace(/<tr([^>]*)bg-slate-50 dark:bg-slate-900/g, '<tr$1');
    content = content.replace(/<tr([^>]*)bg-slate-50 dark:bg-slate-800\/50/g, '<tr$1');
    content = content.replace(/<tr([^>]*)bg-slate-50\/80 dark:bg-slate-800\/50/g, '<tr$1');

    // Remove any existing bg-slate-50 dark:bg-slate-900 from <th> to prevent duplicates
    content = content.replace(/<th([^>]*)bg-slate-50 dark:bg-slate-900/g, '<th$1');
    content = content.replace(/<th([^>]*)bg-slate-50 dark:bg-slate-800\/50/g, '<th$1');
    
    // Add bg-slate-50 dark:bg-slate-900 to all <th> elements
    content = content.replace(/<th([^>]*)className="/g, '<th$1className="bg-slate-50 dark:bg-slate-900 ');
    
    // Clean up multiple spaces
    content = content.replace(/className="bg-slate-50 dark:bg-slate-900\s+/g, 'className="bg-slate-50 dark:bg-slate-900 ');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed table th backgrounds in ${file}`);
    }
  }
}
