#!/usr/bin/env node

/**
 * Dreamwright Language Update Script
 * 
 * Automatically replaces fortune-telling themed language with career-focused language
 * while preserving the Victorian steampunk aesthetic.
 * 
 * Usage: node scripts/update-language.js [--dry-run] [--backup]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Language replacement map
const REPLACEMENTS = {
  // Direct replacements (case-sensitive)
  'fortune': 'career path',
  'Fortune': 'Career Path',
  'FORTUNE': 'CAREER PATH',
  
  'oracle': 'career advisor',
  'Advisor': 'Career Advisor',
  'ORACLE': 'CAREER ADVISOR',
  
  'discovery': 'career assessment',
  'Discovery': 'Career Assessment',
  'DIVINATION': 'CAREER ASSESSMENT',
  
  // Phrase replacements
  'The Brass Guide': 'The Career Engine',
  'Begin Discovery': 'Begin Assessment',
  'Your Path': 'Your Career Path',
  'path awaits': 'career path awaits',
  'Path Awaits': 'Career Path Awaits',
  
  // Context-aware replacements (won't replace "fortune" in fortuneText variable names)
  'consult the brass machine': 'use the career engine',
  'oracle\'s mechanisms': 'career engine\'s mechanisms',
  'The gears shall turn': 'The engine analyzes',
  'Your fortune shall be revealed': 'Your path shall be revealed',
  'reveal your fate': 'reveal your path',
  'brass gears never lie': 'analysis is data-driven',
  
  // File/variable name safe (these won't be replaced in code identifiers)
  // We'll handle these separately
};

// Files to exclude from replacement
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '.expo',
  'ios',
  'android',
  'scripts/update-language.js', // Don't modify this script
];

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const createBackup = args.includes('--backup');

console.log('🎩 Dreamwright Language Update Script');
console.log('=====================================\n');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

// Create backup if requested
if (createBackup && !isDryRun) {
  console.log('💾 Creating backup...');
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backup-${timestamp}`;
    execSync(`mkdir -p backups/${backupDir}`);
    execSync(`cp -r app backups/${backupDir}/`);
    execSync(`cp -r components backups/${backupDir}/ 2>/dev/null || true`);
    execSync(`cp -r services backups/${backupDir}/`);
    console.log(`✅ Backup created: backups/${backupDir}\n`);
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Find all relevant files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Check if should exclude
    if (EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern))) {
      return;
    }
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Smart replace function that avoids variable names
function smartReplace(content, searchTerm, replacement) {
  // Skip if it's part of a variable name (camelCase or snake_case)
  // e.g., fortuneText, fortune_data, saveFortune
  const variablePattern = new RegExp(`[a-zA-Z_]${searchTerm}[a-zA-Z_]`, 'g');
  
  // Create a regex that matches the term but not when it's part of a variable name
  const safePattern = new RegExp(
    `(?<![a-zA-Z_])${searchTerm}(?![a-zA-Z_])`,
    'g'
  );
  
  return content.replace(safePattern, replacement);
}

// Process files
const projectRoot = process.cwd();
const files = findFiles(projectRoot);
const changes = [];

console.log(`📁 Found ${files.length} files to process\n`);

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fileChanges = [];
  
  // Apply replacements
  Object.entries(REPLACEMENTS).forEach(([search, replace]) => {
    const before = content;
    content = smartReplace(content, search, replace);
    
    if (content !== before) {
      modified = true;
      const count = (before.match(new RegExp(search, 'g')) || []).length;
      fileChanges.push(`  - "${search}" → "${replace}" (${count} occurrences)`);
    }
  });
  
  if (modified) {
    const relativePath = path.relative(projectRoot, filePath);
    changes.push({
      file: relativePath,
      changes: fileChanges,
    });
    
    if (!isDryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

// Print report
console.log('📊 CHANGES REPORT');
console.log('=================\n');

if (changes.length === 0) {
  console.log('✅ No fortune-telling language found! App is already career-focused.\n');
} else {
  console.log(`📝 Modified ${changes.length} file(s):\n`);
  
  changes.forEach(({ file, changes: fileChanges }) => {
    console.log(`📄 ${file}`);
    fileChanges.forEach(change => console.log(change));
    console.log('');
  });
  
  if (!isDryRun) {
    console.log('✅ All changes applied successfully!\n');
  } else {
    console.log('ℹ️  No changes were made (dry run mode)\n');
  }
}

// Print next steps
console.log('🎯 NEXT STEPS');
console.log('=============\n');

if (!isDryRun && changes.length > 0) {
  console.log('1. Review the changes in your code editor');
  console.log('2. Test the app to ensure everything works');
  console.log('3. Rebuild: eas build --platform ios --profile production');
  console.log('4. Resubmit to App Store\n');
} else if (isDryRun && changes.length > 0) {
  console.log('Run without --dry-run to apply changes:');
  console.log('  node scripts/update-language.js --backup\n');
} else {
  console.log('Your app is ready! No language changes needed.\n');
}

// Summary statistics
console.log('📈 SUMMARY');
console.log('==========\n');
console.log(`Files scanned: ${files.length}`);
console.log(`Files modified: ${changes.length}`);
console.log(`Total replacements: ${changes.reduce((sum, c) => sum + c.changes.length, 0)}\n`);

if (!isDryRun && changes.length > 0) {
  console.log('✨ Language update complete! Your app is now career-focused. 🚀\n');
}
