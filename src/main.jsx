
import './index.css';
import './legacy/design-system/index.css';
import './legacy/app.css';
import './legacy/dashboard.css';

// Import Legacy Scripts
// Note: These scripts (jobs.js, app.js) were originally global IIFEs or window assignments.
// Importing them here ensures they execute.
import './legacy/jobs.js';
import { initApp } from './legacy/app.js';

// Import Module Entry Points (React components)
// These files use ReactDOM.createRoot to mount themselves into specific DOM elements.
import './dashboard/resume/main-resume';
import './dashboard/prep/main-prep';

console.log('Main entry point loaded');
// Initialize legacy app logic
if (document.readyState === 'complete') {
    initApp();
} else {
    window.addEventListener('load', initApp);
}
