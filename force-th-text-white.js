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
    
    // Remove text color classes from <tr> inside <thead>
    content = content.replace(/(<thead[\s\S]*?<tr[^>]*?)(text-slate-500|text-slate-600|dark:text-slate-400|dark:text-white)\s*/g, '$1');
    content = content.replace(/(<thead[\s\S]*?<tr[^>]*?)(text-slate-500|text-slate-600|dark:text-slate-400|dark:text-white)\s*/g, '$1'); // run twice to catch multiple
    content = content.replace(/(<thead[\s\S]*?<tr[^>]*?)(text-slate-500|text-slate-600|dark:text-slate-400|dark:text-white)\s*/g, '$1');
    
    // Add text-slate-500 dark:text-white directly to all <th> tags
    content = content.replace(/<th([^>]*)className="/g, '<th$1className="text-slate-500 dark:text-white ');

    // Clean up multiple spaces
    content = content.replace(/className="text-slate-500 dark:text-white\s+/g, 'className="text-slate-500 dark:text-white ');
    
    // De-duplicate if it accidentally added multiple
    content = content.replace(/text-slate-500 dark:text-white(.*?)text-slate-500 dark:text-white/g, 'text-slate-500 dark:text-white$1');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Forced TH text color in ${file}`);
    }
  }
}
