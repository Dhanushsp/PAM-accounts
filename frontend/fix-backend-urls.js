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

// Function to fix backend URL issues in a file
function fixBackendUrls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if apiClient is already imported
  const hasApiClientImport = content.includes("import apiClient from");
  
  // Add apiClient import if not present
  if (!hasApiClientImport && (content.includes('process.env.API_BASE_URL') || content.includes('BACKEND_URL'))) {
    // Find the last import statement
    const importMatch = content.match(/(import.*from.*['"];?\n?)/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const apiClientImport = "import apiClient from '../../lib/axios-config';\n";
      content = content.replace(lastImport, lastImport + apiClientImport);
      modified = true;
    }
  }
  
  // Fix patterns for backend URL issues
  const patterns = [
    // Replace process.env.API_BASE_URL with apiClient
    {
      regex: /axios\.get\(`\${process\.env\.API_BASE_URL \|\| 'https:\/\/api\.pamacc\.dhanushdev\.in'}\/api\/([^`]+)`/g,
      replacement: 'apiClient.get(`/api/$1`'
    },
    {
      regex: /axios\.post\(`\${process\.env\.API_BASE_URL \|\| 'https:\/\/api\.pamacc\.dhanushdev\.in'}\/api\/([^`]+)`/g,
      replacement: 'apiClient.post(`/api/$1`'
    },
    {
      regex: /axios\.put\(`\${process\.env\.API_BASE_URL \|\| 'https:\/\/api\.pamacc\.dhanushdev\.in'}\/api\/([^`]+)`/g,
      replacement: 'apiClient.put(`/api/$1`'
    },
    {
      regex: /axios\.delete\(`\${process\.env\.API_BASE_URL \|\| 'https:\/\/api\.pamacc\.dhanushdev\.in'}\/api\/([^`]+)`/g,
      replacement: 'apiClient.delete(`/api/$1`'
    },
    
    // Replace BACKEND_URL with apiClient
    {
      regex: /axios\.get\(`\${BACKEND_URL}\/api\/([^`]+)`/g,
      replacement: 'apiClient.get(`/api/$1`'
    },
    {
      regex: /axios\.post\(`\${BACKEND_URL}\/api\/([^`]+)`/g,
      replacement: 'apiClient.post(`/api/$1`'
    },
    {
      regex: /axios\.put\(`\${BACKEND_URL}\/api\/([^`]+)`/g,
      replacement: 'apiClient.put(`/api/$1`'
    },
    {
      regex: /axios\.delete\(`\${BACKEND_URL}\/api\/([^`]+)`/g,
      replacement: 'apiClient.delete(`/api/$1`'
    },
    
    // Remove manual Authorization headers since apiClient handles them
    {
      regex: /,\s*\{\s*headers:\s*\{\s*Authorization:\s*token\s*\}\s*\}/g,
      replacement: ''
    },
    {
      regex: /,\s*\{\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*Authorization:\s*token\s*\}\s*\}/g,
      replacement: ''
    },
    
    // Remove BACKEND_URL constant declarations
    {
      regex: /const\s+BACKEND_URL\s*=\s*process\.env\.API_BASE_URL\s*\|\|\s*'https:\/\/api\.pamacc\.dhanushdev\.in';\s*\n?/g,
      replacement: ''
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
console.log('🔧 Fixing backend URL issues across the project...\n');

const appDir = path.join(__dirname, 'app');
const tsxFiles = findTsxFiles(appDir);

console.log(`Found ${tsxFiles.length} .tsx files to process:\n`);

for (const file of tsxFiles) {
  try {
    fixBackendUrls(file);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log('\n🎉 Backend URL fixes completed!');
console.log('\nNext steps:');
console.log('1. Test the app to ensure all API calls work correctly');
console.log('2. Check that data is loading properly on all pages');
console.log('3. Verify that the Gemini AI Assistant is working'); 