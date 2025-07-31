const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix API calls in a file
function fixApiCalls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix patterns for manual token passing
  const patterns = [
    // Remove manual Authorization headers
    {
      regex: /,\s*\{\s*headers:\s*\{\s*Authorization:\s*token\s*\}\s*\}/g,
      replacement: ''
    },
    // Remove API_BASE_URL from apiClient calls
    {
      regex: /apiClient\.get\(`\${API_BASE_URL}\/api\//g,
      replacement: 'apiClient.get(`/api/'
    },
    {
      regex: /apiClient\.post\(`\${API_BASE_URL}\/api\//g,
      replacement: 'apiClient.post(`/api/'
    },
    {
      regex: /apiClient\.put\(`\${API_BASE_URL}\/api\//g,
      replacement: 'apiClient.put(`/api/'
    },
    {
      regex: /apiClient\.delete\(`\${API_BASE_URL}\/api\//g,
      replacement: 'apiClient.delete(`/api/'
    },
    // Fix axios calls with BACKEND_URL
    {
      regex: /axios\.get\(`\${BACKEND_URL}\/api\//g,
      replacement: 'apiClient.get(`/api/'
    },
    {
      regex: /axios\.post\(`\${BACKEND_URL}\/api\//g,
      replacement: 'apiClient.post(`/api/'
    },
    {
      regex: /axios\.put\(`\${BACKEND_URL}\/api\//g,
      replacement: 'apiClient.put(`/api/'
    },
    {
      regex: /axios\.delete\(`\${BACKEND_URL}\/api\//g,
      replacement: 'apiClient.delete(`/api/'
    }
  ];
  
  for (const pattern of patterns) {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

// Main execution
console.log('🔧 Fixing API calls across the project...\n');

const appDir = path.join(__dirname, 'app');
const tsxFiles = findTsxFiles(appDir);

console.log(`Found ${tsxFiles.length} .tsx files to process:\n`);

for (const file of tsxFiles) {
  try {
    fixApiCalls(file);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log('\n🎉 API call fixes completed!');
console.log('\nNext steps:');
console.log('1. Import the global.css file in your main App component');
console.log('2. Test the app to ensure all API calls work correctly');
console.log('3. Check that the Gemini AI Assistant button is visible and working'); 