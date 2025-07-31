const fs = require('fs');
const path = require('path');

// Function to convert Tailwind classes to React Native styles
function convertTailwindToReactNative(content) {
  let modified = false;
  
  // Common Tailwind to React Native conversions
  const conversions = [
    // Container styles
    { from: 'className="flex-1 bg-blue-50"', to: 'style={styles.container}' },
    { from: 'className="flex-1 p-4"', to: 'style={styles.content}' },
    
    // Header styles
    { from: 'className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-6 mt-1"', to: 'style={styles.header}' },
    { from: 'className="bg-gray-100 rounded-full p-2"', to: 'style={styles.backButton}' },
    { from: 'className="text-xl font-extrabold text-blue-700 flex-1 text-center"', to: 'style={styles.headerTitle}' },
    
    // Form styles
    { from: 'className="bg-white rounded-xl p-6 shadow-sm"', to: 'style={styles.editForm}' },
    { from: 'className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"', to: 'style={styles.input}' },
    { from: 'className="w-full bg-blue-600 py-3 rounded-xl shadow-sm"', to: 'style={styles.updateButton}' },
    { from: 'className="text-white text-center font-semibold text-lg"', to: 'style={styles.updateButtonText}' },
    
    // List styles
    { from: 'className="flex-1 items-center justify-center"', to: 'style={styles.centerContainer}' },
    { from: 'className="text-gray-500 text-lg"', to: 'style={styles.loadingText}' },
    { from: 'className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"', to: 'style={styles.itemCard}' },
    { from: 'className="flex-row justify-between items-start"', to: 'style={styles.itemCardContent}' },
    { from: 'className="flex-1"', to: 'style={styles.itemInfo}' },
    { from: 'className="text-lg font-semibold text-gray-800 mb-2"', to: 'style={styles.itemName}' },
    { from: 'className="space-y-1"', to: 'style={styles.itemDetails}' },
    { from: 'className="text-sm text-gray-600"', to: 'style={styles.itemDetailText}' },
    { from: 'className="flex-row gap-2 ml-2"', to: 'style={styles.actionButtons}' },
    { from: 'className="bg-blue-100 rounded-full p-2"', to: 'style={styles.editButton}' },
    { from: 'className="bg-red-100 rounded-full p-2"', to: 'style={styles.deleteButton}' },
  ];
  
  for (const conversion of conversions) {
    if (content.includes(conversion.from)) {
      content = content.replace(new RegExp(conversion.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), conversion.to);
      modified = true;
    }
  }
  
  return { content, modified };
}

// Function to add missing styles
function addMissingStyles(content) {
  const commonStyles = `
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d4ed8',
    flex: 1,
    textAlign: 'center',
  },
  // Form Styles
  editForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    fontSize: 16,
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  updateButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  // List Styles
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 18,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    padding: 8,
    elevation: 1,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 8,
    elevation: 1,
  },`;
  
  // Add styles before the closing brace
  if (content.includes('const styles = StyleSheet.create({')) {
    const styleEndIndex = content.lastIndexOf('});');
    if (styleEndIndex !== -1) {
      content = content.slice(0, styleEndIndex) + commonStyles + '\n});';
      return { content, modified: true };
    }
  }
  
  return { content, modified: false };
}

// Main execution
console.log('🔧 Converting Tailwind styles to React Native styles...\n');

const pagesToFix = [
  'frontend/app/pages/Products.tsx',
  'frontend/app/pages/Purchase.tsx',
  'frontend/app/pages/Sales.tsx',
  'frontend/app/pages/Expenses.tsx'
];

for (const filePath of pagesToFix) {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Convert Tailwind to React Native
      const conversionResult = convertTailwindToReactNative(content);
      content = conversionResult.content;
      modified = conversionResult.modified;
      
      // Add missing styles
      const styleResult = addMissingStyles(content);
      content = styleResult.content;
      modified = modified || styleResult.modified;
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('\n🎉 Styling conversion completed!');
console.log('\nNext steps:');
console.log('1. Import global.css in your main App component');
console.log('2. Test the app to ensure all styles are working');
console.log('3. Check that all pages have proper styling'); 