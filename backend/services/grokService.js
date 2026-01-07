// Universal AI Adapter for QA Reporting

export async function analyzeTestResults(reportData, settings) {
  const metrics = calculateMetrics(reportData.results);

  // Check if AI is enabled
  if (!settings.grokAI?.enabled || !settings.grokAI?.apiKey) {
    console.log("⚠️ AI skipped: Not enabled.");
    return generateSimulatedAnalysis(reportData, metrics);
  }

  const prompt = createPrompt(reportData, metrics, settings);
  const provider = settings.grokAI.provider || 'gemini'; 
  const apiKey = settings.grokAI.apiKey;

  try {
    console.log(`🤖 Asking ${provider.toUpperCase()}...`);
    let jsonResponse = "";

    // --- GOOGLE GEMINI ---
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      jsonResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } 
    // --- GROQ CLOUD ---
    else if (provider === 'groq_cloud') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "Output raw JSON only." }, { role: "user", content: prompt }],
          temperature: 0.5
        })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      jsonResponse = data.choices?.[0]?.message?.content || "";
    }
    // --- OPENAI ---
    else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: "Output raw JSON only." }, { role: "user", content: prompt }],
          temperature: 0.5
        })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      jsonResponse = data.choices?.[0]?.message?.content || "";
    }

    if (!jsonResponse) throw new Error("Empty response from AI");

    // Clean & Parse
    const cleanJson = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    parsed.isSimulation = false;
    return parsed;

  } catch (error) {
    console.error("❌ AI Analysis Failed:", error.message);
    // FALLBACK: Return simulation so report doesn't crash
    return generateSimulatedAnalysis(reportData, metrics);
  }
}

// Helpers
function calculateMetrics(results) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'Passed').length;
  const failed = results.filter(r => r.status === 'Failed').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";
  return { total, passed, failed, passRate };
}

function createPrompt(reportData, metrics, settings) {
  const isProject = reportData.type === 'project';
  const name = isProject ? reportData.project.name : reportData.testRun.name;
  return `
    You are a QA Lead. Analyze this report:
    Context: ${isProject ? 'Project Summary' : 'Test Run'} - ${name}
    Metrics: ${metrics.passed}/${metrics.total} Passed (${metrics.passRate}%)
    Return JSON: { "executiveSummary": "...", "riskAssessment": "...", "keyRecommendations": "...", "conclusion": "..." }
  `;
}

function generateSimulatedAnalysis(reportData, metrics) {
  return {
    isSimulation: true,
    executiveSummary: `Analysis complete. Pass Rate: ${metrics.passRate}%.`,
    riskAssessment: metrics.passRate > 90 ? "Low" : "High",
    keyRecommendations: "Review results.",
    conclusion: metrics.passRate > 90 ? "GO" : "NO-GO"
  };
}
// ... existing imports ...

// Ensure this function returns the object properly
export async function generateWordReport(reportData) {
  const fileName = `QA_Report_${Date.now()}.docx`;
  const filePath = join(REPORTS_DIR, fileName);
  
  // ... existing doc generation logic ...

  try {
    const doc = new Document({ /* ... structure ... */ });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    
    // RETURN THIS OBJECT
    return { filePath, fileName }; 
  } catch (error) { throw error; }
}