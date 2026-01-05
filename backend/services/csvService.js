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
 * Get column value with flexible matching
 */
function getColumnValue(row, ...possibleNames) {
  for (const name of possibleNames) {
    // Exact match first
    if (row[name] !== undefined && row[name] !== null && row[name].toString().trim() !== '') {
      return row[name].toString().trim();
    }
    // Case-insensitive match
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
 * Normalize priority value
 */
function normalizePriority(priority) {
  if (!priority) return 'Medium';
  const normalized = priority.toString().toLowerCase().trim();
  
  if (normalized === '1' || normalized.includes('critical') || normalized.includes('p1')) return 'Critical';
  if (normalized === '2' || normalized.includes('high') || normalized.includes('p2')) return 'High';
  if (normalized === '3' || normalized.includes('medium') || normalized.includes('p3')) return 'Medium';
  if (normalized === '4' || normalized.includes('low') || normalized.includes('p4')) return 'Low';
  
  return 'Medium';
}

/**
 * Strip HTML tags from string
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
 * 
 * Format:
 * - Title row: Has "Title" but no "Test Step" number
 * - Step rows: Have "Test Step" number but no "Title"
 * 
 * Example:
 * Row 1: Title="Verify Dashboard", Test Step="", Step Action=""
 * Row 2: Title="", Test Step="1", Step Action="Click login", Step Expected="Page loads"
 * Row 3: Title="", Test Step="2", Step Action="Enter credentials", Step Expected="Fields accept input"
 */
export function parseADOFormat(rawData) {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('Invalid or empty CSV data');
  }

  console.log('📋 CSV Columns detected:', Object.keys(rawData[0]));
  console.log('📋 Total rows:', rawData.length);

  const testCases = [];
  let currentTestCase = null;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip completely empty rows
    const hasAnyValue = Object.values(row).some(val => val && val.toString().trim());
    if (!hasAnyValue) {
      continue;
    }

    // Extract values
    const id = getColumnValue(row, 'ID', 'Id', 'id', 'Test Case ID', 'Work Item ID');
    const workItemType = getColumnValue(row, 'Work Item Type', 'Type');
    const title = stripHTML(getColumnValue(row, 'Title', 'Title 1', 'Test Case Title', 'Name'));
    const testStep = getColumnValue(row, 'Test Step', 'Step', 'Step Number', 'Step #');
    const stepAction = stripHTML(getColumnValue(row, 'Step Action', 'Action', 'Test Action'));
    const stepExpected = stripHTML(getColumnValue(row, 'Step Expected', 'Expected', 'Expected Result', 'Expected Results'));
    const areaPath = getColumnValue(row, 'Area Path', 'Area', 'Path');
    const assignedTo = getColumnValue(row, 'Assigned To', 'Assigned', 'Owner');
    const state = getColumnValue(row, 'State', 'Status');
    const scenarioType = getColumnValue(row, 'Scenario Type', 'Scenario', 'Type');
    const priority = getColumnValue(row, 'Priority');
    const description = stripHTML(getColumnValue(row, 'Description'));

    console.log(`Row ${i + 1}: Title="${title}", TestStep="${testStep}", Action="${stepAction.substring(0, 30)}..."`);

    // Determine if this is a title row or a step row
    const hasTitle = title && title.trim().length > 0;
    const hasStepNumber = testStep && testStep.trim().length > 0;
    const hasStepAction = stepAction && stepAction.trim().length > 0;
    const hasStepExpected = stepExpected && stepExpected.trim().length > 0;

    if (hasTitle && !hasStepNumber) {
      // This is a TITLE ROW - create new test case
      // Save previous test case if exists
      if (currentTestCase) {
        testCases.push(currentTestCase);
      }

      currentTestCase = {
        adoId: id || null,
        title: title,
        description: description,
        steps: [],
        expectedResult: '',
        priority: normalizePriority(priority),
        status: 'Not Run',
        assignedTo: assignedTo,
        tags: [],
        automationStatus: 'Manual',
        areaPath: areaPath,
        state: state,
        scenarioType: scenarioType,
        workItemType: workItemType || 'Test Case'
      };

      console.log(`  → New test case: "${title}"`);

    } else if (hasStepNumber || hasStepAction || hasStepExpected) {
      // This is a STEP ROW - add to current test case
      if (currentTestCase) {
        const stepNum = parseInt(testStep, 10) || (currentTestCase.steps.length + 1);
        
        currentTestCase.steps.push({
          stepNumber: stepNum,
          action: stepAction || '',
          expectedResult: stepExpected || ''
        });

        // Update test case metadata from step rows (they often repeat)
        if (areaPath && !currentTestCase.areaPath) currentTestCase.areaPath = areaPath;
        if (assignedTo && !currentTestCase.assignedTo) currentTestCase.assignedTo = assignedTo;
        if (state && !currentTestCase.state) currentTestCase.state = state;
        if (scenarioType && !currentTestCase.scenarioType) currentTestCase.scenarioType = scenarioType;

        console.log(`  → Added step ${stepNum}: "${stepAction.substring(0, 40)}..."`);
      } else {
        // Step row without a title row before it - create test case from step
        console.log(`  ⚠️ Step row without title, creating test case from action`);
        
        currentTestCase = {
          adoId: id || null,
          title: stepAction || `Test Case ${testCases.length + 1}`,
          description: '',
          steps: [{
            stepNumber: parseInt(testStep, 10) || 1,
            action: stepAction || '',
            expectedResult: stepExpected || ''
          }],
          expectedResult: '',
          priority: normalizePriority(priority),
          status: 'Not Run',
          assignedTo: assignedTo,
          tags: [],
          automationStatus: 'Manual',
          areaPath: areaPath,
          state: state,
          scenarioType: scenarioType,
          workItemType: workItemType || 'Test Case'
        };
      }
    } else if (hasTitle && hasStepNumber) {
      // Row has both title and step - it's a single-row test case with first step
      if (currentTestCase) {
        testCases.push(currentTestCase);
      }

      currentTestCase = {
        adoId: id || null,
        title: title,
        description: description,
        steps: [{
          stepNumber: parseInt(testStep, 10) || 1,
          action: stepAction || '',
          expectedResult: stepExpected || ''
        }],
        expectedResult: '',
        priority: normalizePriority(priority),
        status: 'Not Run',
        assignedTo: assignedTo,
        tags: [],
        automationStatus: 'Manual',
        areaPath: areaPath,
        state: state,
        scenarioType: scenarioType,
        workItemType: workItemType || 'Test Case'
      };

      console.log(`  → New test case with step: "${title}"`);
    }
  }

  // Don't forget the last test case
  if (currentTestCase) {
    testCases.push(currentTestCase);
  }

  // Sort steps within each test case
  testCases.forEach(tc => {
    if (tc.steps && tc.steps.length > 0) {
      tc.steps.sort((a, b) => a.stepNumber - b.stepNumber);
    }
  });

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Parsed ${testCases.length} test cases:`);
  testCases.forEach((tc, idx) => {
    console.log(`   ${idx + 1}. "${tc.title}" - ${tc.steps.length} steps`);
    tc.steps.forEach(step => {
      console.log(`      Step ${step.stepNumber}: ${step.action.substring(0, 50)}...`);
    });
  });
  console.log('═══════════════════════════════════════════');

  return testCases;
}

/**
 * Validate CSV format
 */
export function validateADOFormat(rawData) {
  const result = {
    isValid: true,
    issues: [],
    warnings: [],
    detectedColumns: []
  };

  if (!rawData || rawData.length === 0) {
    result.isValid = false;
    result.issues.push('CSV file is empty');
    return result;
  }

  result.detectedColumns = Object.keys(rawData[0]);
  
  const hasTitle = result.detectedColumns.some(c => 
    ['title', 'title 1', 'test case title', 'name'].includes(c.toLowerCase().trim())
  );
  
  if (!hasTitle) {
    result.isValid = false;
    result.issues.push('No "Title" column found');
  }

  const hasStepAction = result.detectedColumns.some(c => 
    c.toLowerCase().trim().includes('step action') || c.toLowerCase().trim() === 'action'
  );
  
  const hasStepExpected = result.detectedColumns.some(c => 
    c.toLowerCase().trim().includes('step expected') || c.toLowerCase().trim().includes('expected')
  );

  if (hasStepAction) result.warnings.push('✓ Found "Step Action" column');
  if (hasStepExpected) result.warnings.push('✓ Found "Step Expected" column');

  return result;
}

export default {
  parseCSVFile,
  parseADOFormat,
  validateADOFormat
};