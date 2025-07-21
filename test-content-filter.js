// Test script to verify content filter functionality
const { contentFilter } = require('./src/lib/services/content-filter.ts');

// Test content that should be filtered
const testContent = `
Here's an analysis of the company:

Future Performance Outlook

| Scenario | Drivers | Likelihood | | Bull Case | - Azure GM% recovers to 70%+ by FY26
• Copilot reaches 100M users by FY26 | 40% | | Base Case | - Steady 15-20% cloud growth, margins stabilize
• Capex normalizes at ~20% of revenue | 50% | | Bear Case | - AI adoption plateaus; regulatory fines escalate
• GPU shortages delay Azure scale | 10% |

This table shows different scenarios for the company's future performance.
`;

console.log('Original content:');
console.log(testContent);
console.log('\n' + '='.repeat(50) + '\n');

console.log('Filtered content:');
const filtered = contentFilter.filterContent(testContent);
console.log(filtered);

console.log('\n' + '='.repeat(50) + '\n');

console.log('Contains forbidden content?', contentFilter.containsForbiddenContent(testContent));

const validation = contentFilter.validateContent(testContent);
console.log('Validation result:', validation);
