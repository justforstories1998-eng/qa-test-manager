/**
 * Grok AI Service
 * Integrates with xAI's Grok API for intelligent test analysis and report generation
 */

/**
 * Call Grok API with provided prompt
 * @param {string} prompt - The prompt to send to Grok
 * @param {Object} settings - Grok AI settings from database
 * @returns {Promise<string>} - AI response text
 */
async function callGrokAPI(prompt, settings) {
  const {
    apiKey,
    apiEndpoint = 'https://api.x.ai/v1/chat/completions',
    model = 'grok-beta',
    maxTokens = 2048,
    temperature = 0.7
  } = settings;

  if (!apiKey) {
    throw new Error('Grok API key is not configured');
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert QA analyst assistant. Your role is to analyze test execution results, identify patterns, assess risks, and provide actionable recommendations. Be concise, professional, and data-driven in your analysis. Format your responses with clear sections and bullet points where appropriate.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }

    return data.choices[0].message.content;

  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Unable to connect to Grok API. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Format test results data for AI analysis
 * @param {Object} testRun - Test run information
 * @param {Array} results - Detailed execution results
 * @returns {string} - Formatted data string
 */
function formatTestDataForAI(testRun, results) {
  const statusCounts = {
    passed: results.filter(r => r.status === 'Passed').length,
    failed: results.filter(r => r.status === 'Failed').length,
    blocked: results.filter(r => r.status === 'Blocked').length,
    notRun: results.filter(r => r.status === 'Not Run').length
  };

  const totalTests = results.length;
  const passRate = totalTests > 0 ? ((statusCounts.passed / totalTests) * 100).toFixed(1) : 0;
  const failRate = totalTests > 0 ? ((statusCounts.failed / totalTests) * 100).toFixed(1) : 0;

  // Group failed tests by priority
  const failedByPriority = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  results
    .filter(r => r.status === 'Failed')
    .forEach(r => {
      const priority = (r.testCase?.priority || 'medium').toLowerCase();
      if (failedByPriority[priority]) {
        failedByPriority[priority].push({
          title: r.testCase?.title || 'Unknown',
          comments: r.comments || 'No comments provided'
        });
      }
    });

  // Group blocked tests
  const blockedTests = results
    .filter(r => r.status === 'Blocked')
    .map(r => ({
      title: r.testCase?.title || 'Unknown',
      comments: r.comments || 'No reason provided'
    }));

  // Build formatted string
  let dataString = `
TEST RUN INFORMATION:
- Name: ${testRun.name}
- Environment: ${testRun.environment || 'Not specified'}
- Tester: ${testRun.tester || 'Not specified'}
- Build Number: ${testRun.buildNumber || 'Not specified'}
- Started: ${testRun.startedAt || 'Not recorded'}
- Completed: ${testRun.completedAt || 'In progress'}

EXECUTION SUMMARY:
- Total Test Cases: ${totalTests}
- Passed: ${statusCounts.passed} (${passRate}%)
- Failed: ${statusCounts.failed} (${failRate}%)
- Blocked: ${statusCounts.blocked}
- Not Run: ${statusCounts.notRun}

PASS RATE: ${passRate}%
`;

  if (statusCounts.failed > 0) {
    dataString += `
FAILED TEST CASES BY PRIORITY:
`;
    if (failedByPriority.critical.length > 0) {
      dataString += `\nCRITICAL PRIORITY (${failedByPriority.critical.length}):\n`;
      failedByPriority.critical.forEach((t, i) => {
        dataString += `  ${i + 1}. ${t.title}\n     Comments: ${t.comments}\n`;
      });
    }
    if (failedByPriority.high.length > 0) {
      dataString += `\nHIGH PRIORITY (${failedByPriority.high.length}):\n`;
      failedByPriority.high.forEach((t, i) => {
        dataString += `  ${i + 1}. ${t.title}\n     Comments: ${t.comments}\n`;
      });
    }
    if (failedByPriority.medium.length > 0) {
      dataString += `\nMEDIUM PRIORITY (${failedByPriority.medium.length}):\n`;
      failedByPriority.medium.forEach((t, i) => {
        dataString += `  ${i + 1}. ${t.title}\n     Comments: ${t.comments}\n`;
      });
    }
    if (failedByPriority.low.length > 0) {
      dataString += `\nLOW PRIORITY (${failedByPriority.low.length}):\n`;
      failedByPriority.low.forEach((t, i) => {
        dataString += `  ${i + 1}. ${t.title}\n     Comments: ${t.comments}\n`;
      });
    }
  }

  if (blockedTests.length > 0) {
    dataString += `
BLOCKED TEST CASES (${blockedTests.length}):
`;
    blockedTests.forEach((t, i) => {
      dataString += `  ${i + 1}. ${t.title}\n     Reason: ${t.comments}\n`;
    });
  }

  return dataString;
}

/**
 * Analyze test results with Grok AI
 * @param {Object} testRun - Test run information
 * @param {Array} results - Detailed execution results with test case data
 * @param {Object} settings - Grok AI settings
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeTestResults(testRun, results, settings) {
  const formattedData = formatTestDataForAI(testRun, results);

  const analysisPrompt = `
Analyze the following QA test execution results and provide a comprehensive analysis:

${formattedData}

Please provide your analysis in the following structure:

1. EXECUTIVE SUMMARY
   - Brief overview of the test execution (2-3 sentences)
   - Overall quality assessment

2. KEY FINDINGS
   - Most significant issues discovered
   - Patterns or trends in failures
   - Areas of concern

3. RISK ASSESSMENT
   - Risk level (Critical/High/Medium/Low)
   - Justification for risk level
   - Potential impact on release

4. RECOMMENDATIONS
   - Immediate actions required
   - Suggested areas for investigation
   - Process improvements

5. RELEASE READINESS
   - Go/No-Go recommendation with rationale
   - Conditions for release (if applicable)

Be specific and reference actual test case data in your analysis.
`;

  try {
    const analysisText = await callGrokAPI(analysisPrompt, settings);

    // Parse the response into sections
    const analysis = {
      rawAnalysis: analysisText,
      generatedAt: new Date().toISOString(),
      testRunId: testRun.id,
      sections: parseAnalysisSections(analysisText)
    };

    console.log('✅ Grok AI analysis completed successfully');
    return analysis;

  } catch (error) {
    console.error('❌ Grok AI analysis failed:', error.message);
    throw error;
  }
}

/**
 * Generate AI-powered summary for reports
 * @param {Object} testRun - Test run information
 * @param {Array} results - Detailed execution results
 * @param {Object} settings - Grok AI settings
 * @returns {Promise<Object>} - Summary data
 */
export async function generateAISummary(testRun, results, settings) {
  const formattedData = formatTestDataForAI(testRun, results);

  const summaryPrompt = `
Based on the following test execution data, generate a professional executive summary suitable for inclusion in a QA report:

${formattedData}

Generate the summary in the following format:

EXECUTIVE SUMMARY:
[2-3 paragraphs providing a high-level overview of the test execution, key findings, and overall quality assessment]

KEY METRICS INTERPRETATION:
[Brief interpretation of the pass/fail rates and what they indicate about product quality]

CRITICAL ISSUES:
[Bullet points listing the most critical issues that need immediate attention, if any]

NEXT STEPS:
[Recommended actions based on the test results]

Keep the tone professional and suitable for stakeholder communication.
`;

  try {
    const summaryText = await callGrokAPI(summaryPrompt, settings);

    const summary = {
      content: summaryText,
      generatedAt: new Date().toISOString(),
      testRunId: testRun.id,
      type: 'executive_summary'
    };

    console.log('✅ Grok AI summary generated successfully');
    return summary;

  } catch (error) {
    console.error('❌ Grok AI summary generation failed:', error.message);
    throw error;
  }
}

/**
 * Generate recommendations for failed tests
 * @param {Object} testRun - Test run information
 * @param {Array} failedResults - Failed test results only
 * @param {Object} settings - Grok AI settings
 * @returns {Promise<Object>} - Recommendations
 */
export async function generateFailureRecommendations(testRun, failedResults, settings) {
  if (!failedResults || failedResults.length === 0) {
    return {
      recommendations: [],
      message: 'No failed tests to analyze',
      generatedAt: new Date().toISOString()
    };
  }

  const failedTestsData = failedResults.map(r => ({
    title: r.testCase?.title || 'Unknown',
    priority: r.testCase?.priority || 'Medium',
    description: r.testCase?.description || '',
    steps: r.testCase?.steps || [],
    comments: r.comments || 'No failure comments provided',
    executedBy: r.executedBy || 'Unknown'
  }));

  const recommendationsPrompt = `
Analyze the following failed test cases and provide specific troubleshooting recommendations:

TEST RUN: ${testRun.name}
ENVIRONMENT: ${testRun.environment || 'Not specified'}

FAILED TEST CASES:
${JSON.stringify(failedTestsData, null, 2)}

For each failed test case, provide:

1. POSSIBLE ROOT CAUSES
   - List 2-3 potential reasons for the failure

2. INVESTIGATION STEPS
   - Specific steps the QA team should take to investigate

3. SUGGESTED FIX AREAS
   - Areas of the application that developers should examine

4. REGRESSION RISK
   - Other areas that might be affected by related fixes

Format your response clearly with test case titles as headers.
`;

  try {
    const recommendationsText = await callGrokAPI(recommendationsPrompt, settings);

    const recommendations = {
      content: recommendationsText,
      failedTestCount: failedResults.length,
      generatedAt: new Date().toISOString(),
      testRunId: testRun.id
    };

    console.log('✅ Grok AI recommendations generated successfully');
    return recommendations;

  } catch (error) {
    console.error('❌ Grok AI recommendations failed:', error.message);
    throw error;
  }
}

/**
 * Generate test coverage insights
 * @param {Array} testCases - All test cases
 * @param {Array} executionHistory - Historical execution data
 * @param {Object} settings - Grok AI settings
 * @returns {Promise<Object>} - Coverage insights
 */
export async function generateCoverageInsights(testCases, executionHistory, settings) {
  const coverageData = {
    totalTestCases: testCases.length,
    byPriority: {
      critical: testCases.filter(tc => tc.priority === 'Critical').length,
      high: testCases.filter(tc => tc.priority === 'High').length,
      medium: testCases.filter(tc => tc.priority === 'Medium').length,
      low: testCases.filter(tc => tc.priority === 'Low').length
    },
    byAutomation: {
      manual: testCases.filter(tc => tc.automationStatus === 'Manual').length,
      automated: testCases.filter(tc => tc.automationStatus === 'Automated').length,
      planned: testCases.filter(tc => tc.automationStatus === 'Planned').length
    },
    executionRuns: executionHistory.length
  };

  const insightsPrompt = `
Analyze the following test suite coverage data and provide insights:

${JSON.stringify(coverageData, null, 2)}

Please provide:

1. COVERAGE ASSESSMENT
   - Overall test coverage health
   - Balance of test priorities
   - Automation coverage status

2. GAPS IDENTIFIED
   - Potential coverage gaps based on priority distribution
   - Automation opportunities

3. RECOMMENDATIONS
   - Suggestions for improving test coverage
   - Priority areas for new test development
   - Automation strategy recommendations

4. METRICS TO TRACK
   - Key metrics the team should monitor
   - Target values for improvement
`;

  try {
    const insightsText = await callGrokAPI(insightsPrompt, settings);

    const insights = {
      content: insightsText,
      coverageData,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Grok AI coverage insights generated successfully');
    return insights;

  } catch (error) {
    console.error('❌ Grok AI coverage insights failed:', error.message);
    throw error;
  }
}

/**
 * Parse analysis text into structured sections
 * @param {string} analysisText - Raw analysis text from AI
 * @returns {Object} - Parsed sections
 */
function parseAnalysisSections(analysisText) {
  const sections = {
    executiveSummary: '',
    keyFindings: '',
    riskAssessment: '',
    recommendations: '',
    releaseReadiness: ''
  };

  const sectionPatterns = [
    { key: 'executiveSummary', patterns: ['EXECUTIVE SUMMARY', '1.', 'SUMMARY'] },
    { key: 'keyFindings', patterns: ['KEY FINDINGS', '2.', 'FINDINGS'] },
    { key: 'riskAssessment', patterns: ['RISK ASSESSMENT', '3.', 'RISK'] },
    { key: 'recommendations', patterns: ['RECOMMENDATIONS', '4.', 'RECOMMEND'] },
    { key: 'releaseReadiness', patterns: ['RELEASE READINESS', '5.', 'RELEASE', 'GO/NO-GO'] }
  ];

  // Simple section extraction - find content between section headers
  const lines = analysisText.split('\n');
  let currentSection = '';

  lines.forEach(line => {
    const trimmedLine = line.trim().toUpperCase();
    
    // Check if this line starts a new section
    for (const section of sectionPatterns) {
      if (section.patterns.some(p => trimmedLine.includes(p))) {
        currentSection = section.key;
        return;
      }
    }

    // Add line to current section
    if (currentSection && sections.hasOwnProperty(currentSection)) {
      sections[currentSection] += line + '\n';
    }
  });

  // Trim all sections
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });

  return sections;
}

/**
 * Validate Grok API connection
 * @param {Object} settings - Grok AI settings
 * @returns {Promise<Object>} - Validation result
 */
export async function validateGrokConnection(settings) {
  try {
    const testPrompt = 'Respond with "Connection successful" to confirm the API is working.';
    const response = await callGrokAPI(testPrompt, { ...settings, maxTokens: 50 });

    return {
      success: true,
      message: 'Grok AI connection validated successfully',
      response: response.substring(0, 100)
    };

  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      error: error.message
    };
  }
}

export default {
  analyzeTestResults,
  generateAISummary,
  generateFailureRecommendations,
  generateCoverageInsights,
  validateGrokConnection
};