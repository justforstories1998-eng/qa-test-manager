import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak
} from 'docx';
import { writeFile } from 'fs/promises';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'uploads', 'reports');

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

// ============================================
// COLOR DEFINITIONS
// ============================================

const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#0891b2',
  light: '#f8fafc',
  dark: '#1e293b',
  passed: '#16a34a',
  failed: '#dc2626',
  blocked: '#d97706',
  notRun: '#64748b'
};

const PDF_COLORS = {
  primary: [37, 99, 235],
  secondary: [100, 116, 139],
  success: [22, 163, 74],
  danger: [220, 38, 38],
  warning: [217, 119, 6],
  passed: [22, 163, 74],
  failed: [220, 38, 38],
  blocked: [217, 119, 6],
  notRun: [100, 116, 139],
  headerBg: [241, 245, 249],
  white: [255, 255, 255],
  black: [0, 0, 0],
  gray: [71, 85, 105]
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate pass rate percentage
 */
function calculatePassRate(results) {
  if (!results || results.length === 0) return 0;
  const passed = results.filter(r => r.status === 'Passed').length;
  return ((passed / results.length) * 100).toFixed(1);
}

/**
 * Get status counts from results
 */
function getStatusCounts(results) {
  return {
    passed: results.filter(r => r.status === 'Passed').length,
    failed: results.filter(r => r.status === 'Failed').length,
    blocked: results.filter(r => r.status === 'Blocked').length,
    notRun: results.filter(r => r.status === 'Not Run').length
  };
}

/**
 * Generate unique filename
 */
function generateFileName(testRunName, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = testRunName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  return `QA_Report_${safeName}_${timestamp}.${format}`;
}

// ============================================
// PDF REPORT GENERATION
// ============================================

/**
 * Generate PDF report
 * @param {Object} reportData - Report data containing testRun, results, settings
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - File path and name
 */
export async function generatePDFReport(reportData, options = {}) {
  const { testRun, results, settings } = reportData;
  const fileName = generateFileName(testRun.name, 'pdf');
  const filePath = join(REPORTS_DIR, fileName);
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: settings?.pdfPageSize || 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `QA Test Report - ${testRun.name}`,
          Author: 'QA Test Manager',
          Subject: 'Test Execution Report',
          CreatedDate: new Date()
        }
      });
      
      const stream = createWriteStream(filePath);
      doc.pipe(stream);
      
      const statusCounts = getStatusCounts(results);
      const passRate = calculatePassRate(results);
      
      // ========== COVER PAGE ==========
      doc.fontSize(28)
         .fillColor(PDF_COLORS.primary)
         .text('QA Test Execution Report', { align: 'center' });
      
      doc.moveDown(2);
      
      doc.fontSize(20)
         .fillColor(PDF_COLORS.dark)
         .text(testRun.name, { align: 'center' });
      
      doc.moveDown(3);
      
      // Summary box
      const boxY = doc.y;
      doc.rect(50, boxY, doc.page.width - 100, 150)
         .fillAndStroke(PDF_COLORS.headerBg, PDF_COLORS.secondary);
      
      doc.fillColor(PDF_COLORS.black)
         .fontSize(12);
      
      const summaryData = [
        ['Generated:', formatDate(new Date().toISOString())],
        ['Test Run:', testRun.name],
        ['Environment:', testRun.environment || 'N/A'],
        ['Tester:', testRun.tester || 'N/A'],
        ['Total Tests:', results.length.toString()],
        ['Pass Rate:', `${passRate}%`]
      ];
      
      let summaryY = boxY + 20;
      summaryData.forEach(([label, value]) => {
        doc.font('Helvetica-Bold')
           .text(label, 70, summaryY, { continued: true, width: 120 })
           .font('Helvetica')
           .text(value, { width: 300 });
        summaryY += 20;
      });
      
      doc.moveDown(8);
      
      // Status summary circles
      const circleY = doc.y + 20;
      const circleRadius = 35;
      const spacing = 130;
      const startX = 100;
      
      const statusItems = [
        { label: 'Passed', count: statusCounts.passed, color: PDF_COLORS.passed },
        { label: 'Failed', count: statusCounts.failed, color: PDF_COLORS.failed },
        { label: 'Blocked', count: statusCounts.blocked, color: PDF_COLORS.blocked },
        { label: 'Not Run', count: statusCounts.notRun, color: PDF_COLORS.notRun }
      ];
      
      statusItems.forEach((item, index) => {
        const x = startX + (index * spacing);
        
        doc.circle(x, circleY, circleRadius)
           .fillAndStroke(item.color, item.color);
        
        doc.fillColor(PDF_COLORS.white)
           .fontSize(18)
           .text(item.count.toString(), x - 15, circleY - 8, { width: 30, align: 'center' });
        
        doc.fillColor(PDF_COLORS.dark)
           .fontSize(10)
           .text(item.label, x - 30, circleY + circleRadius + 10, { width: 60, align: 'center' });
      });
      
      // ========== NEW PAGE - DETAILED RESULTS ==========
      doc.addPage();
      
      doc.fontSize(18)
         .fillColor(PDF_COLORS.primary)
         .text('Test Execution Details', { underline: true });
      
      doc.moveDown(1);
      
      // Table header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [40, 200, 80, 80, 90];
      
      // Header row
      doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), 25)
         .fill(PDF_COLORS.primary);
      
      doc.fillColor(PDF_COLORS.white)
         .fontSize(10)
         .font('Helvetica-Bold');
      
      const headers = ['#', 'Test Case', 'Priority', 'Status', 'Duration'];
      let headerX = tableLeft + 5;
      headers.forEach((header, i) => {
        doc.text(header, headerX, tableTop + 8, { width: colWidths[i] - 10 });
        headerX += colWidths[i];
      });
      
      // Table rows
      let rowY = tableTop + 25;
      doc.font('Helvetica').fontSize(9);
      
      results.forEach((result, index) => {
        // Check for page break
        if (rowY > doc.page.height - 100) {
          doc.addPage();
          rowY = 50;
        }
        
        const rowColor = index % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.headerBg;
        doc.rect(tableLeft, rowY, colWidths.reduce((a, b) => a + b, 0), 25)
           .fill(rowColor);
        
        const testCase = result.testCase || {};
        let cellX = tableLeft + 5;
        
        // Row number
        doc.fillColor(PDF_COLORS.dark)
           .text((index + 1).toString(), cellX, rowY + 8, { width: colWidths[0] - 10 });
        cellX += colWidths[0];
        
        // Test case title (truncate if needed)
        const title = (testCase.title || 'Unknown').substring(0, 40);
        doc.text(title, cellX, rowY + 8, { width: colWidths[1] - 10 });
        cellX += colWidths[1];
        
        // Priority
        doc.text(testCase.priority || 'Medium', cellX, rowY + 8, { width: colWidths[2] - 10 });
        cellX += colWidths[2];
        
        // Status with color
        const statusColor = PDF_COLORS[result.status?.toLowerCase().replace(' ', '')] || PDF_COLORS.notRun;
        doc.fillColor(statusColor)
           .text(result.status || 'Not Run', cellX, rowY + 8, { width: colWidths[3] - 10 });
        cellX += colWidths[3];
        
        // Duration
        doc.fillColor(PDF_COLORS.dark)
           .text(result.duration ? `${result.duration}s` : '-', cellX, rowY + 8, { width: colWidths[4] - 10 });
        
        rowY += 25;
      });
      
      // ========== FAILED TESTS DETAILS ==========
      const failedTests = results.filter(r => r.status === 'Failed');
      
      if (failedTests.length > 0 && settings?.includeFailedTests !== false) {
        doc.addPage();
        
        doc.fontSize(18)
           .fillColor(PDF_COLORS.danger)
           .text('Failed Test Cases', { underline: true });
        
        doc.moveDown(1);
        
        failedTests.forEach((result, index) => {
          if (doc.y > doc.page.height - 150) {
            doc.addPage();
          }
          
          const testCase = result.testCase || {};
          
          doc.fontSize(12)
             .fillColor(PDF_COLORS.dark)
             .font('Helvetica-Bold')
             .text(`${index + 1}. ${testCase.title || 'Unknown Test'}`, { continued: false });
          
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(PDF_COLORS.gray);
          
          if (testCase.adoId) {
            doc.text(`ADO ID: ${testCase.adoId}`);
          }
          
          doc.text(`Priority: ${testCase.priority || 'Medium'}`);
          
          if (result.comments) {
            doc.moveDown(0.5)
               .fillColor(PDF_COLORS.danger)
               .text('Comments:', { continued: true })
               .fillColor(PDF_COLORS.dark)
               .text(` ${result.comments}`);
          }
          
          if (result.executedBy) {
            doc.text(`Executed By: ${result.executedBy}`);
          }
          
          if (result.executedAt) {
            doc.text(`Executed At: ${formatDate(result.executedAt)}`);
          }
          
          doc.moveDown(1);
        });
      }
      
      // ========== FOOTER ON ALL PAGES ==========
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        doc.fontSize(8)
           .fillColor(PDF_COLORS.secondary)
           .text(
             settings?.reportFooter || 'Generated by QA Test Manager',
             50,
             doc.page.height - 30,
             { align: 'center', width: doc.page.width - 100 }
           );
        
        doc.text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 30,
          { align: 'right', width: doc.page.width - 100 }
        );
      }
      
      doc.end();
      
      stream.on('finish', () => {
        console.log(`✅ PDF report generated: ${fileName}`);
        resolve({ filePath, fileName });
      });
      
      stream.on('error', (err) => {
        reject(new Error(`PDF generation failed: ${err.message}`));
      });
      
    } catch (error) {
      reject(new Error(`PDF generation error: ${error.message}`));
    }
  });
}

// ============================================
// WORD REPORT GENERATION
// ============================================

/**
 * Generate Word (DOCX) report
 * @param {Object} reportData - Report data containing testRun, results, settings
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - File path and name
 */
export async function generateWordReport(reportData, options = {}) {
  const { testRun, results, settings } = reportData;
  const fileName = generateFileName(testRun.name, 'docx');
  const filePath = join(REPORTS_DIR, fileName);
  
  try {
    const statusCounts = getStatusCounts(results);
    const passRate = calculatePassRate(results);
    
    const children = [];
    
    // ========== TITLE ==========
    children.push(
      new Paragraph({
        text: 'QA Test Execution Report',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );
    
    children.push(
      new Paragraph({
        text: testRun.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      })
    );
    
    // ========== EXECUTIVE SUMMARY ==========
    children.push(
      new Paragraph({
        text: 'Executive Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );
    
    // Summary table
    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['Property', 'Value'], true),
        createTableRow(['Report Generated', formatDate(new Date().toISOString())]),
        createTableRow(['Test Run Name', testRun.name]),
        createTableRow(['Environment', testRun.environment || 'N/A']),
        createTableRow(['Tester', testRun.tester || 'N/A']),
        createTableRow(['Build Number', testRun.buildNumber || 'N/A']),
        createTableRow(['Start Time', formatDate(testRun.startedAt)]),
        createTableRow(['End Time', formatDate(testRun.completedAt)]),
        createTableRow(['Total Test Cases', results.length.toString()]),
        createTableRow(['Pass Rate', `${passRate}%`])
      ]
    });
    
    children.push(summaryTable);
    
    // ========== STATUS BREAKDOWN ==========
    children.push(
      new Paragraph({
        text: 'Test Results Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 600, after: 200 }
      })
    );
    
    const statusTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['Status', 'Count', 'Percentage'], true),
        createStatusRow('Passed', statusCounts.passed, results.length, '16A34A'),
        createStatusRow('Failed', statusCounts.failed, results.length, 'DC2626'),
        createStatusRow('Blocked', statusCounts.blocked, results.length, 'D97706'),
        createStatusRow('Not Run', statusCounts.notRun, results.length, '64748B')
      ]
    });
    
    children.push(statusTable);
    
    // ========== DETAILED RESULTS ==========
    children.push(
      new Paragraph({
        text: 'Detailed Test Results',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 600, after: 200 }
      })
    );
    
    // Results table
    const resultsRows = [
      createTableRow(['#', 'Test Case', 'Priority', 'Status', 'Comments'], true)
    ];
    
    results.forEach((result, index) => {
      const testCase = result.testCase || {};
      resultsRows.push(
        createTableRow([
          (index + 1).toString(),
          (testCase.title || 'Unknown').substring(0, 50),
          testCase.priority || 'Medium',
          result.status || 'Not Run',
          (result.comments || '-').substring(0, 30)
        ])
      );
    });
    
    const resultsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: resultsRows
    });
    
    children.push(resultsTable);
    
    // ========== FAILED TESTS SECTION ==========
    const failedTests = results.filter(r => r.status === 'Failed');
    
    if (failedTests.length > 0 && settings?.includeFailedTests !== false) {
      children.push(
        new Paragraph({
          children: [new PageBreak()]
        })
      );
      
      children.push(
        new Paragraph({
          text: 'Failed Test Cases - Details',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        })
      );
      
      failedTests.forEach((result, index) => {
        const testCase = result.testCase || {};
        
        children.push(
          new Paragraph({
            text: `${index + 1}. ${testCase.title || 'Unknown Test'}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 100 }
          })
        );
        
        if (testCase.adoId) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'ADO ID: ', bold: true }),
                new TextRun({ text: testCase.adoId })
              ]
            })
          );
        }
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Priority: ', bold: true }),
              new TextRun({ text: testCase.priority || 'Medium' })
            ]
          })
        );
        
        if (testCase.description) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Description: ', bold: true }),
                new TextRun({ text: testCase.description })
              ]
            })
          );
        }
        
        if (result.comments) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Failure Comments: ', bold: true, color: 'DC2626' }),
                new TextRun({ text: result.comments })
              ],
              spacing: { before: 100 }
            })
          );
        }
        
        if (result.executedBy) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Executed By: ', bold: true }),
                new TextRun({ text: result.executedBy })
              ]
            })
          );
        }
      });
    }
    
    // ========== FOOTER ==========
    children.push(
      new Paragraph({
        text: settings?.reportFooter || 'Generated by QA Test Manager',
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        children: [
          new TextRun({
            text: settings?.reportFooter || 'Generated by QA Test Manager',
            color: '64748B',
            size: 20
          })
        ]
      })
    );
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });
    
    // Generate and save file
    const buffer = await Packer.toBuffer(doc);
    await writeFile(filePath, buffer);
    
    console.log(`✅ Word report generated: ${fileName}`);
    return { filePath, fileName };
    
  } catch (error) {
    throw new Error(`Word generation error: ${error.message}`);
  }
}

/**
 * Create a table row for Word document
 */
function createTableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(text => 
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: isHeader,
                size: isHeader ? 24 : 22
              })
            ]
          })
        ],
        shading: isHeader ? {
          fill: '2563EB',
          type: ShadingType.SOLID,
          color: 'FFFFFF'
        } : undefined
      })
    )
  });
}

/**
 * Create a status row with color coding
 */
function createStatusRow(status, count, total, color) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  
  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: status,
                bold: true,
                color: color
              })
            ]
          })
        ]
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: count.toString(),
                color: color
              })
            ]
          })
        ]
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${percentage}%`,
                color: color
              })
            ]
          })
        ]
      })
    ]
  });
}

export default {
  generatePDFReport,
  generateWordReport
};