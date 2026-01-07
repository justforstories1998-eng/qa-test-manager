import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, HeadingLevel, AlignmentType, Header, Footer
} from 'docx';
import { getSettings } from '../database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'uploads', 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function calculateMetrics(results) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'Passed').length;
  const failed = results.filter(r => r.status === 'Failed').length;
  const blocked = results.filter(r => r.status === 'Blocked').length;
  const notRun = results.filter(r => r.status === 'Not Run').length;
  const na = results.filter(r => r.status === 'N/A').length;
  
  const executed = total - notRun;
  const passRate = executed > 0 ? ((passed / executed) * 100).toFixed(1) : "0.0";

  const defects = {
    Critical: results.filter(r => r.status === 'Failed' && r.testCase?.priority === 'Critical').length,
    High: results.filter(r => r.status === 'Failed' && r.testCase?.priority === 'High').length,
    Medium: results.filter(r => r.status === 'Failed' && r.testCase?.priority === 'Medium').length,
    Low: results.filter(r => r.status === 'Failed' && r.testCase?.priority === 'Low').length
  };

  return { total, passed, failed, blocked, notRun, na, passRate, defects };
}

// ==========================================
// 1. PDF GENERATION
// ==========================================
export async function generatePDFReport(reportData) {
  const fileName = `QA_Report_${Date.now()}.pdf`;
  const filePath = join(REPORTS_DIR, fileName);
  const settings = await getSettings();
  const metrics = calculateMetrics(reportData.results);
  const orgName = settings.general?.organization || 'QA Department';
  const ai = reportData.aiAnalysis || {};
  
  // Safe Property Access
  const isProject = reportData.type === 'project';
  const title = isProject ? 'Project Status Report' : 'Test Execution Report';
  const runName = isProject ? 'All Project Runs' : (reportData.testRun?.name || 'Unknown Run');
  const environment = isProject ? 'Multiple' : (reportData.testRun?.environment || 'QA');
  const version = isProject ? 'Aggregated' : (reportData.testRun?.buildNumber || '1.0.0');
  const tester = isProject ? 'QA Team' : (reportData.testRun?.tester || 'QA Engineer');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- HEADER ---
      doc.rect(0, 0, 600, 100).fill('#1e293b');
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text(title, 50, 35);
      doc.fontSize(12).font('Helvetica').text(orgName, 50, 70);
      
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, 400, 35, { align: 'right' });
      doc.text(`Version: ${version}`, 400, 50, { align: 'right' });
      doc.text(`Prepared By: ${tester}`, 400, 65, { align: 'right' });

      doc.moveDown(6);
      doc.fillColor('black');

      // --- AI BADGE ---
      if (ai && !ai.isSimulation) {
        const badgeX = 450; const badgeY = doc.y;
        doc.roundedRect(badgeX, badgeY, 100, 20, 10).fill('#e0e7ff');
        doc.fillColor('#4338ca').fontSize(10).font('Helvetica-Bold').text('✨ AI Generated', badgeX, badgeY + 5, { width: 100, align: 'center' });
        doc.fillColor('black');
      }

      drawSection(doc, '2. Executive Summary');
      doc.font('Helvetica').fontSize(11).text(ai.executiveSummary || `This report documents results for ${runName}. Pass Rate: ${metrics.passRate}%.`, { align: 'justify', lineGap: 4 });
      doc.moveDown(2);

      drawSection(doc, '3. Test Scope');
      doc.text(ai.scopeOverview || '• Modules Tested: Core Functionality, User Flows');
      doc.moveDown(2);

      drawSection(doc, '4. Test Environment');
      doc.text(`• Environment: ${environment}`);
      doc.text(`• Browser: Chrome / Edge (Latest)`);
      doc.moveDown(2);

      drawSection(doc, '5. Test Summary');
      const sumHeaders = ['Total', 'Passed', 'Failed', 'Blocked', 'N/A', 'Rate'];
      const sumValues = [metrics.total, metrics.passed, metrics.failed, metrics.blocked, metrics.na, `${metrics.passRate}%`];
      drawTable(doc, sumHeaders, [sumValues]);
      doc.moveDown(2);

      drawSection(doc, '6. Defect Summary');
      const defectHeaders = ['Critical', 'High', 'Medium', 'Low', 'Total Open'];
      const defectRows = [[metrics.defects.Critical, metrics.defects.High, metrics.defects.Medium, metrics.defects.Low, metrics.failed]];
      drawTable(doc, defectHeaders, defectRows);
      doc.moveDown(2);

      // --- DETAILED DEFECTS ---
      doc.addPage();
      drawSection(doc, '7. Detailed Defect List');
      const failedTests = reportData.results.filter(r => r.status === 'Failed');
      if (failedTests.length === 0) {
        doc.text("No defects found in this run.", { align: 'center' });
      } else {
        failedTests.forEach((res, i) => {
          if (doc.y > 700) doc.addPage();
          doc.rect(50, doc.y - 5, 500, 1).fill('#e2e8f0'); 
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fillColor('#b91c1c').text(`Defect #${i+1}: ${res.testCase?.title || 'Unknown'}`);
          doc.font('Helvetica').fontSize(10).fillColor('black');
          doc.text(`ID: ${res.testCase?.adoId || 'N/A'} | Priority: ${res.testCase?.priority || 'Medium'}`);
          doc.font('Helvetica-Oblique').text(`Observation: ${res.comments || 'No details provided.'}`);
          doc.moveDown(1);
        });
      }
      doc.moveDown(2);

      drawSection(doc, '8. Risks & Issues');
      doc.font('Helvetica').text(ai.riskAssessment || "No critical risks identified.");
      doc.moveDown(2);

      drawSection(doc, '9. Recommendations & Sign-Off');
      if (ai.keyRecommendations) {
        doc.font('Helvetica-Bold').text("Key Recommendations:");
        doc.font('Helvetica').text(ai.keyRecommendations);
        doc.moveDown();
      }
      const conclusion = ai.conclusion || (metrics.passRate >= 90 ? "GO - Approved" : "NO-GO - Fixes Required");
      const color = metrics.passRate >= 90 ? '#16a34a' : '#dc2626';
      doc.font('Helvetica-Bold').fillColor(color).fontSize(14).text(`DECISION: ${conclusion}`, { align: 'center' });
      
      doc.moveDown(4);
      doc.fillColor('black').fontSize(11).font('Helvetica');
      doc.text('__________________________          __________________________');
      doc.text('QA Lead Signature                    Project Manager Signature');

      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).fillColor('#94a3b8').text(`Page ${i + 1} of ${pages.count}`, 50, 750, { align: 'center', width: 500 });
      }

      doc.end();
      stream.on('finish', () => resolve({ filePath, fileName }));
      stream.on('error', reject);
    } catch (error) { reject(error); }
  });
}

function drawSection(doc, title) {
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#334155').text(title);
  doc.rect(50, doc.y, 500, 2).fill('#e2e8f0');
  doc.moveDown(0.8);
  doc.fontSize(11).font('Helvetica').fillColor('black');
}

function drawTable(doc, headers, rows) {
  const startX = 50;
  const rowHeight = 25;
  const colWidth = 500 / headers.length;
  const headerY = doc.y;
  doc.rect(startX, headerY, 500, rowHeight).fill('#f1f5f9');
  doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
  headers.forEach((h, i) => doc.text(h, startX + (i * colWidth), headerY + 8, { width: colWidth, align: 'center' }));
  let currentY = headerY + rowHeight;
  doc.font('Helvetica').fontSize(10);
  rows.forEach((row) => {
    doc.rect(startX, currentY, 500, rowHeight).strokeColor('#e2e8f0').stroke();
    row.forEach((cell, i) => doc.text(String(cell), startX + (i * colWidth), currentY + 8, { width: colWidth, align: 'center' }));
    currentY += 25;
  });
  doc.y = currentY + 10;
}

// ==========================================
// 2. WORD GENERATION (DOCX)
// ==========================================
export async function generateWordReport(reportData) {
  const fileName = `QA_Report_${Date.now()}.docx`;
  const filePath = join(REPORTS_DIR, fileName);
  const settings = await getSettings();
  const metrics = calculateMetrics(reportData.results);
  const ai = reportData.aiAnalysis || {};
  const orgName = settings.general?.organization || 'QA Department';

  // Safe Property Access for Word
  const isProject = reportData.type === 'project';
  const reportTitle = isProject ? "PROJECT STATUS REPORT" : "QA TEST EXECUTION REPORT";
  const runName = isProject ? "All Project Runs" : (reportData.testRun?.name || "Unknown Run");
  const envName = isProject ? "Multiple" : (reportData.testRun?.environment || "QA");
  const testerName = isProject ? "QA Team" : (reportData.testRun?.tester || "QA Engineer");

  try {
    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: reportTitle, bold: true, size: 28, color: "1E3A8A" }),
                  new TextRun({ text: `\t${orgName}`, size: 20 })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Confidential Report")] })]
          })
        },
        children: [
          createHeading("1. Report Header"),
          createKeyValue("Project Name", settings.general?.projectName || 'Project'),
          createKeyValue("Scope", runName),
          createKeyValue("Date", new Date().toLocaleDateString()),
          createKeyValue("Prepared By", testerName),
          
          createHeading("2. Executive Summary"),
          new Paragraph(ai.executiveSummary || `Testing completed with a ${metrics.passRate}% pass rate.`),

          createHeading("3. Test Scope"),
          new Paragraph(ai.scopeOverview || "Functional & Regression Testing."),

          createHeading("4. Test Environment"),
          createKeyValue("Environment", envName),

          createHeading("5. Test Summary"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createHeaderRow(["Total", "Passed", "Failed", "Rate"]),
              createRow([metrics.total, metrics.passed, metrics.failed, `${metrics.passRate}%`])
            ]
          }),

          createHeading("6. Defect Summary"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createHeaderRow(["Severity", "Total"]),
              createRow(["Critical", metrics.defects.Critical]),
              createRow(["High", metrics.defects.High])
            ]
          }),

          createHeading("7. Detailed Defect List"),
          ...(reportData.results.filter(r => r.status === 'Failed').length > 0 
            ? reportData.results.filter(r => r.status === 'Failed').map(r => 
                new Paragraph({ text: `Defect: ${r.testCase?.title || 'Unknown'} - ${r.comments || ''}` })
              )
            : [new Paragraph("No defects found.")]
          ),

          createHeading("8. Risks & Issues"),
          new Paragraph(ai.riskAssessment || "None"),

          createHeading("9. Recommendations & Sign-Off"),
          new Paragraph(ai.keyRecommendations || ""),
          new Paragraph({ text: `\nDECISION: ${ai.conclusion || "GO"}`, bold: true })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return { filePath, fileName };
  } catch (error) { throw error; }
}

function createHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: "2E75B6" })],
    spacing: { before: 400, after: 200 },
    heading: HeadingLevel.HEADING_2
  });
}

function createKeyValue(key, value) {
  return new Paragraph({ children: [new TextRun({ text: `${key}: `, bold: true }), new TextRun(String(value))] });
}

function createHeaderRow(cells) {
  return new TableRow({ children: cells.map(c => new TableCell({ children: [new Paragraph({ text: String(c), bold: true })], shading: { fill: "F1F5F9" } })) });
}

function createRow(cells) {
  return new TableRow({ children: cells.map(c => new TableCell({ children: [new Paragraph(String(c))] })) });
}