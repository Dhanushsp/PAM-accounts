const fs = require('fs');
const path = require('path');

// Function to fix import paths in personal-finance directory
function fixImportPaths() {
  const personalFinanceDir = path.join(__dirname, 'app', 'components', 'personal-finance');
  
  if (!fs.existsSync(personalFinanceDir)) {
    console.log('❌ Personal finance directory not found');
    return;
  }
  
  const files = fs.readdirSync(personalFinanceDir).filter(file => file.endsWith('.tsx'));
  
  console.log('🔧 Fixing import paths in personal-finance directory...\n');
  
  for (const file of files) {
    const filePath = path.join(personalFinanceDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix the incorrect import path
    if (content.includes("import apiClient from '../../lib/axios-config'")) {
      content = content.replace(
        "import apiClient from '../../lib/axios-config'",
        "import apiClient from '../../../lib/axios-config'"
      );
      modified = true;
      console.log(`✅ Fixed: ${file}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
  
  console.log('\n🎉 Import path fixes completed!');
}

// Run the fix
fixImportPaths(); 