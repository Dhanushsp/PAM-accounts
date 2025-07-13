// Global warning suppressor for resizeMode deprecation warnings
export const suppressResizeModeWarnings = () => {
  if (typeof window !== 'undefined') {
    // Suppress console.warn
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('resizeMode') ||
         args[0].includes('Image:') ||
         args[0].includes('style.resizeMode') ||
         args[0].includes('Image: style.resizeMode is deprecated') ||
         args[0].includes('Image: resizeMode is deprecated'))
      ) {
        return;
      }
      originalWarn(...args);
    };

    // Suppress console.error
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('resizeMode') || args[0].includes('Image'))
      ) {
        return;
      }
      originalError(...args);
    };

    // Suppress React warnings
    const originalLog = console.log;
    console.log = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('resizeMode') || args[0].includes('Image'))
      ) {
        return;
      }
      originalLog(...args);
    };
  }
};

// Apply suppression immediately
suppressResizeModeWarnings(); 