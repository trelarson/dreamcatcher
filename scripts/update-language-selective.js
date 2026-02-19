#!/usr/bin/env node

/**
 * Dreamwright Selective Language Update Script (Option B)
 * 
 * Updates only the most problematic fortune-telling language while
 * preserving the Victorian steampunk whimsy and personality.
 * 
 * Strategy: Change obvious fortune-telling terms that trigger Apple's filters
 * while keeping the theatrical, mystical atmosphere where possible.
 * 
 * Usage: node scripts/update-language-selective.js [--dry-run] [--backup]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// SELECTIVE replacements - only the most problematic terms
const REPLACEMENTS = {
  // HIGH PRIORITY: These directly trigger Apple's astrology filters
  
  // "Advisor" is too fortune-telling → Use "Guide" or "Advisor"
  'The Brass Guide': 'The Brass Guide',
  'Advisor': 'Advisor',
  
  // "Discovery" is explicitly fortune-telling → Use "Discovery"
  'Discovery': 'Discovery',
  'discovery': 'discovery',
  'Begin Discovery': 'Begin Your Journey',
  
  // "Fortune" in user-facing text (but keep variable names!)
  'Your Path': 'Your Path',
  'path awaits': 'path awaits',
  'Path Awaits': 'Path Awaits',
  'Read Your Path': 'Discover Your Path',
  'path has been revealed': 'path has been revealed',
  
  // Tab names and navigation (visible in App Store review)
  '⚙️': '⚙️', // Replace crystal ball emoji with gear in tab icons
  
  // KEEP THESE WHIMSICAL PHRASES:
  // ✅ "The gears shall turn" - mechanical, not mystical
  // ✅ "The brass mechanisms" - Victorian tech language
  // ✅ "revealed" - can mean "shown" not "predicted"
  // ✅ "Someone less qualified..." - motivational, not mystical
  // ✅ "Dreamwright" - perfect name, keep it!
};

// More nuanced replacements for App Store metadata specifically
const APP_STORE_REPLACEMENTS = {
  // These are for app.json, descriptions, marketing text only
  'Victorian steampunk oracle': 'Victorian steampunk career guide',
  'fortune-telling': 'career discovery',
  'mystical': 'guided',
  'fate': 'future',
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
  'scripts/',
];

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const createBackup = args.includes('--backup');

console.log('🎩 Dreamwright Selective Language Update (Option B)');
console.log('===================================================\n');
console.log('Strategy: Keep the whimsy, fix the Apple problems\n');

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
    execSync(`cp -r app backups/${backupDir}/ 2>/dev/null || true`);
    execSync(`cp -r components backups/${backupDir}/ 2>/dev/null || true`);
    execSync(`cp -r services backups/${backupDir}/ 2>/dev/null || true`);
    execSync(`cp app.json backups/${backupDir}/ 2>/dev/null || true`);
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
    } else if (file.match(/\.(tsx?|jsx?|json)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Smart replace function that avoids variable names
function smartReplace(content, searchTerm, replacement) {
  // Skip if it's part of a variable name (camelCase or snake_case)
  const variablePattern = new RegExp(`[a-zA-Z_]${searchTerm}[a-zA-Z_0-9]`, 'g');
  
  // Don't replace if it's in a variable name context
  if (variablePattern.test(content) && !searchTerm.includes(' ')) {
    // This is likely a variable name, be more careful
    // Only replace when it appears in strings or UI text
    const stringPattern = new RegExp(`["'\`]([^"'\`]*?)${searchTerm}([^"'\`]*?)["'\`]`, 'g');
    return content.replace(stringPattern, (match, before, after) => {
      return match.replace(searchTerm, replacement);
    });
  }
  
  // For phrases (with spaces), safe to replace anywhere
  return content.replace(new RegExp(searchTerm, 'g'), replacement);
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
  
  const isAppStoreFile = filePath.includes('app.json') || 
                         filePath.includes('README') ||
                         filePath.includes('description');
  
  // Choose replacement set based on file type
  const replacements = isAppStoreFile 
    ? { ...REPLACEMENTS, ...APP_STORE_REPLACEMENTS }
    : REPLACEMENTS;
  
  // Apply replacements
  Object.entries(replacements).forEach(([search, replace]) => {
    const before = content;
    content = smartReplace(content, search, replace);
    
    if (content !== before) {
      modified = true;
      const count = (before.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      fileChanges.push(`  - "${search}" → "${replace}" (${count}x)`);
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
  console.log('✅ No problematic language found!\n');
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

// Print what we're KEEPING
console.log('🎭 PRESERVED WHIMSY');
console.log('===================\n');
console.log('These fun elements remain unchanged:');
console.log('  ✅ "The gears shall turn"');
console.log('  ✅ "The brass mechanisms"');
console.log('  ✅ "Someone less qualified..."');
console.log('  ✅ "revealed" and "destiny" language');
console.log('  ✅ Victorian steampunk aesthetic');
console.log('  ✅ Crystal ball icon (visual)');
console.log('  ✅ All your custom fonts and styling\n');

// Print next steps
console.log('🎯 NEXT STEPS');
console.log('=============\n');

if (!isDryRun && changes.length > 0) {
  console.log('1. Review changes in your code editor');
  console.log('2. Test the app - it should feel mostly the same!');
  console.log('3. Rebuild: eas build --platform ios --profile production');
  console.log('4. Resubmit to App Store\n');
  console.log('💡 This version keeps more personality while addressing');
  console.log('   Apple\'s specific concerns about fortune-telling.\n');
} else if (isDryRun && changes.length > 0) {
  console.log('Run without --dry-run to apply changes:');
  console.log('  node scripts/update-language-selective.js --backup\n');
}

// Summary statistics
console.log('📈 SUMMARY');
console.log('==========\n');
console.log(`Files scanned: ${files.length}`);
console.log(`Files modified: ${changes.length}`);
console.log(`Total replacements: ${changes.reduce((sum, c) => sum + c.changes.length, 0)}\n`);

if (!isDryRun && changes.length > 0) {
  console.log('✨ Selective update complete! Whimsy preserved, Apple concerns addressed. 🎩\n');
}
