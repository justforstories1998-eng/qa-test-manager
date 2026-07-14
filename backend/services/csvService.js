import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

function detectDelimiter(firstLine) {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const max = Math.max(tabs, semicolons, pipes, commas);
  if (max === 0) return ',';
  if (tabs === max) return '\t';
  if (semicolons === max) return ';';
  if (pipes === max) return '|';
  return ',';
}

/**
 * Parse a CSV file and return array of objects.
 * Accepts a Buffer (from multer memoryStorage) or a file path string.
 * Auto-detects delimiter (comma, tab, semicolon, pipe).
 */
export function parseCSVFile(source) {
  return new Promise((resolve, reject) => {
    const records = [];

    let content = '';
    const chunks = [];

    const finish = (buf) => {
      const text = buf.toString('utf-8');
      const firstLine = text.split(/\r?\n/)[0] || '';
      const delimiter = detectDelimiter(firstLine);
      console.log('CSV delimiter detected:', JSON.stringify(delimiter));

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        bom: true,
        delimiter
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

      Readable.from(buf).pipe(parser);
    };

    if (Buffer.isBuffer(source)) {
      finish(source);
    } else if (typeof source === 'string') {
      const readStream = createReadStream(source, { encoding: 'utf-8' });
      readStream.on('error', (err) => {
        reject(new Error(`File read error: ${err.message}`));
      });
      readStream.on('data', (chunk) => chunks.push(chunk));
      readStream.on('end', () => finish(Buffer.from(chunks.join(''))));
    } else {
      reject(new Error('Invalid source: expected Buffer or file path'));
    }
  });
}

/**
 * Case-insensitive, fuzzy column match.
 * Tries exact match first, then normalized (lowercase, no spaces/underscores/hyphens).
 */
function getColumnValue(row, ...possibleNames) {
  const keys = Object.keys(row);

  for (const name of possibleNames) {
    const norm = name.toLowerCase().replace(/[\s_\-\/]/g, '');

    for (const key of keys) {
      const keyNorm = key.toLowerCase().trim();
      if (keyNorm === name.toLowerCase().trim()) {
        const val = row[key];
        if (val !== undefined && val !== null && val.toString().trim() !== '') {
          return val.toString().trim();
        }
      }
    }

    for (const key of keys) {
      const keyNorm = key.toLowerCase().replace(/[\s_\-\/]/g, '');
      if (keyNorm === norm) {
        const val = row[key];
        if (val !== undefined && val !== null && val.toString().trim() !== '') {
          return val.toString().trim();
        }
      }
    }
  }
  return '';
}

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
 * Auto-detect column headers and build a mapping.
 * Works with ANY CSV format — ADO, Jira, plain, custom, etc.
 */
function detectColumnMapping(headers) {
  const mapping = {
    id: null,
    workItemType: null,
    title: null,
    description: null,
    testStep: null,
    stepAction: null,
    stepExpected: null,
    assignedTo: null,
    areaPath: null,
    scenarioType: null,
    priority: null,
    state: null
  };

  const norm = (s) => (s || '').toLowerCase().replace(/[\s_\-\/\.]/g, '');

  for (const h of headers) {
    const n = norm(h);
    if (!mapping.id && /^(id|testcaseid|testcase|test case id|test case|workitem id|work item id|workitemid|item id|item number)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.id = h;
    }
    if (!mapping.workItemType && /^(workitemtype|workitem type|work item type|type|itemtype|item type|kind|category)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.workItemType = h;
    }
    if (!mapping.title && /^(title|name|summary|testcase name|test case name|testcasename|scenario|description title)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.title = h;
    }
    if (!mapping.description && /^(desc|description|details|detail|notes|comment|comments|remark|body)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.description = h;
    }
    if (!mapping.testStep && /^(teststep|test step|step|stepnumber|step number|step id|step no)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.testStep = h;
    }
    if (!mapping.stepAction && /^(stepaction|step action|action|step description|steescription|expected action|what to do)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.stepAction = h;
    }
    if (!mapping.stepExpected && /^(stepexpected|step expected|expected|expected result|expected outcome|result|outcome|validation)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.stepExpected = h;
    }
    if (!mapping.assignedTo && /^(assigned|assignedto|assigned to|owner|tester|assignee|executed by)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.assignedTo = h;
    }
    if (!mapping.areaPath && /^(area|areapath|area path|path|module|feature|component|section)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.areaPath = h;
    }
    if (!mapping.scenarioType && /^(scenario|scenariotype|scenario type|test type|case type|testcase type)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.scenarioType = h;
    }
    if (!mapping.priority && /^(priority|pri|sev|severity|importance|urgency)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.priority = h;
    }
    if (!mapping.state && /^(state|status|result|outcome|condition)$/i.test(n.replace(/[\s_\-\/\.]/g, ''))) {
      mapping.state = h;
    }
  }

  return mapping;
}

/**
 * Generic CSV parser — accepts ANY heading and any format.
 * Falls back to treating every row as a separate test case if no step columns detected.
 */
export function parseADOFormat(rawData) {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('Invalid or empty CSV data');
  }

  const headers = Object.keys(rawData[0]);
  const mapping = detectColumnMapping(headers);

  console.log('CSV column mapping:', mapping);
  console.log('CSV headers found:', headers);

  const val = (row, field) => stripHTML(getColumnValue(row, ...(field === 'title' ? ['Title', 'Name', 'Summary'] : [])));

  const testCases = [];
  let currentTestCase = null;
  const hasStepColumns = mapping.testStep || mapping.stepAction || mapping.stepExpected;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    const hasAnyValue = Object.values(row).some(v => v && v.toString().trim());
    if (!hasAnyValue) continue;

    const id = mapping.id ? (row[mapping.id] || '').toString().trim() : '';
    const title = stripHTML(mapping.title ? (row[mapping.title] || '').toString().trim() : '');
    const testStep = mapping.testStep ? (row[mapping.testStep] || '').toString().trim() : '';
    const stepAction = stripHTML(mapping.stepAction ? (row[mapping.stepAction] || '').toString().trim() : '');
    const stepExpected = stripHTML(mapping.stepExpected ? (row[mapping.stepExpected] || '').toString().trim() : '');
    const assignedTo = mapping.assignedTo ? (row[mapping.assignedTo] || '').toString().trim() : '';
    const areaPath = mapping.areaPath ? (row[mapping.areaPath] || '').toString().trim() : '';
    const scenarioType = mapping.scenarioType ? (row[mapping.scenarioType] || '').toString().trim() : '';
    const priority = (mapping.priority ? (row[mapping.priority] || '').toString().trim() : '') || 'Medium';
    const description = stripHTML(mapping.description ? (row[mapping.description] || '').toString().trim() : '');
    const state = mapping.state ? (row[mapping.state] || '').toString().trim() : 'Active';

    if (hasStepColumns) {
      const hasTitle = title.length > 0;
      const hasStepNumber = testStep.length > 0;

      if (hasTitle && !hasStepNumber) {
        if (currentTestCase) testCases.push(currentTestCase);
        currentTestCase = {
          adoId: id || null,
          title,
          description,
          steps: [],
          priority,
          assignedTo,
          areaPath,
          scenarioType,
          state
        };
      } else if (hasStepNumber || stepAction || stepExpected) {
        if (currentTestCase) {
          currentTestCase.steps.push({
            stepNumber: parseInt(testStep, 10) || (currentTestCase.steps.length + 1),
            action: stepAction,
            expectedResult: stepExpected
          });
        } else {
          currentTestCase = {
            adoId: id || null,
            title: title || stepAction || 'Untitled Test Case',
            steps: [{ stepNumber: 1, action: stepAction, expectedResult: stepExpected }],
            priority,
            assignedTo,
            areaPath,
            scenarioType,
            state
          };
        }
      }
    } else {
      const tcTitle = title || stepAction || description || `Test Case ${i + 1}`;
      testCases.push({
        adoId: id || null,
        title: tcTitle,
        description,
        steps: [],
        priority,
        assignedTo,
        areaPath,
        scenarioType,
        state
      });
    }
  }

  if (currentTestCase) testCases.push(currentTestCase);

  return testCases.map(tc => {
    tc.steps.sort((a, b) => a.stepNumber - b.stepNumber);
    return tc;
  });
}

export default { parseCSVFile, parseADOFormat };
