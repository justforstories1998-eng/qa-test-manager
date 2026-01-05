import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

/**
 * Parse a CSV file and return array of objects
 */
export async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true
    });
    
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    
    parser.on('error', (err) => {
      reject(new Error(`CSV parsing error: ${err.message}`));
    });
    
    parser.on('end', () => {
      resolve(records);
    });
    
    const readStream = createReadStream(filePath, { encoding: 'utf-8' });
    
    readStream.on('error', (err) => {
      reject(new Error(`File read error: ${err.message}`));
    });
    
    readStream.pipe(parser);
  });
}

/**
 * Helper to get column value with case-insensitive matching
 */
function getColumnValue(row, ...possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name].toString().trim() !== '') {
      return row[name].toString().trim();
    }
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().trim() === name.toLowerCase().trim()) {
        const val = row[key];
        if (val !== undefined && val !== null && val.toString().trim() !== '') {
          return val.toString().trim();
        }
      }
    }
  }
  return '';
}

/**
 * Clean HTML and whitespace
 */
function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Parse ADO format CSV
 * Supports the format: ID, Work Item Type, Title, Test Step, Step Action, Step Expected
 */
export function parseADOFormat(rawData) {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('Invalid or empty CSV data');
  }

  const testCases = [];
  let currentTestCase = null;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    const hasAnyValue = Object.values(row).some(val => val && val.toString().trim());
    if (!hasAnyValue) continue;

    // Extract raw values
    const id = getColumnValue(row, 'ID', 'Id', 'Test Case ID');
    const title = stripHTML(getColumnValue(row, 'Title', 'Name'));
    const testStep = getColumnValue(row, 'Test Step', 'Step');
    const stepAction = stripHTML(getColumnValue(row, 'Step Action', 'Action'));
    const stepExpected = stripHTML(getColumnValue(row, 'Step Expected', 'Expected'));
    const assignedTo = getColumnValue(row, 'Assigned To');
    const areaPath = getColumnValue(row, 'Area Path');
    const scenarioType = getColumnValue(row, 'Scenario Type');
    const priority = getColumnValue(row, 'Priority') || 'Medium';

    const hasTitle = title && title.trim().length > 0;
    const hasStepNumber = testStep && testStep.trim().length > 0;

    // LOGIC: If a row has a Title but no Step Number, it's a NEW Test Case header
    if (hasTitle && !hasStepNumber) {
      if (currentTestCase) testCases.push(currentTestCase);

      currentTestCase = {
        adoId: id || null,
        title: title,
        description: stripHTML(getColumnValue(row, 'Description')),
        steps: [],
        priority: priority,
        assignedTo: assignedTo,
        areaPath: areaPath,
        scenarioType: scenarioType,
        state: getColumnValue(row, 'State') || 'Active'
      };
    } 
    // LOGIC: If a row has a Step Number (or Action), add it to the current Test Case
    else if (hasStepNumber || stepAction || stepExpected) {
      if (currentTestCase) {
        currentTestCase.steps.push({
          stepNumber: parseInt(testStep, 10) || (currentTestCase.steps.length + 1),
          action: stepAction,
          expectedResult: stepExpected
        });
      } else {
        // Fallback: Create a test case if the CSV starts with a step row
        currentTestCase = {
          title: title || stepAction || 'Untitled Test Case',
          steps: [{ stepNumber: 1, action: stepAction, expectedResult: stepExpected }],
          priority: 'Medium'
        };
      }
    }
  }

  // Add the last test case
  if (currentTestCase) testCases.push(currentTestCase);

  // Clean up: Sort steps and ensure no 'id' fields exist (MongoDB creates them)
  return testCases.map(tc => {
    tc.steps.sort((a, b) => a.stepNumber - b.stepNumber);
    return tc;
  });
}

export default {
  parseCSVFile,
  parseADOFormat
};