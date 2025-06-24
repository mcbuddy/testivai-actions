const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs-extra');
const path = require('path');

/**
 * Generate and post a comment with the visual regression report
 * 
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @param {string} reportPath - Path to the report directory
 * @param {Object} result - Result of the approval/rejection process
 * @returns {boolean} - Success status
 */
async function postReportComment(octokit, context, reportPath, result) {
  try {
    // Check if we're in a PR context
    if (!context.payload.issue || !context.payload.issue.number) {
      core.warning('Not in a PR context, skipping report comment');
      return false;
    }

    const reportHtmlPath = path.join(path.dirname(reportPath), 'index.html');
    
    // Check if the report HTML exists
    if (!await fs.pathExists(reportHtmlPath)) {
      core.warning(`Report HTML not found at ${reportHtmlPath}`);
      return false;
    }

    // Read the report HTML content
    const reportHtml = await fs.readFile(reportHtmlPath, 'utf8');
    
    // Extract relevant parts or generate a summary
    const reportSummary = generateReportSummary(reportHtml, result);
    
    // Create the comment body
    const commentBody = createCommentBody(reportSummary, result);
    
    // Post the comment to the PR
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      body: commentBody
    });
    
    core.info('Posted report comment to PR');
    return true;
  } catch (error) {
    core.warning(`Failed to post report comment: ${error.message}`);
    return false;
  }
}

/**
 * Generate a summary from the report HTML
 * 
 * @param {string} reportHtml - The HTML content of the report
 * @param {Object} result - Result of the approval/rejection process
 * @returns {Object} - Summary object with key metrics
 */
function generateReportSummary(reportHtml, result) {
  // Extract relevant information from the HTML
  // This is a simplified version - in a real implementation,
  // you would parse the HTML and extract meaningful data
  
  const summary = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    approvedChanges: result.approvedFiles ? result.approvedFiles.length : 0,
    rejectedChanges: result.rejectedFiles ? result.rejectedFiles.length : 0
  };
  
  // Try to extract test counts from the HTML
  try {
    const totalMatch = reportHtml.match(/Total Tests:\s*(\d+)/i);
    const passedMatch = reportHtml.match(/Passed Tests:\s*(\d+)/i);
    const failedMatch = reportHtml.match(/Failed Tests:\s*(\d+)/i);
    
    if (totalMatch) summary.totalTests = parseInt(totalMatch[1], 10);
    if (passedMatch) summary.passedTests = parseInt(passedMatch[1], 10);
    if (failedMatch) summary.failedTests = parseInt(failedMatch[1], 10);
  } catch (error) {
    core.warning(`Failed to parse report HTML: ${error.message}`);
  }
  
  return summary;
}

/**
 * Create the comment body with the report summary
 * 
 * @param {Object} summary - Report summary
 * @param {Object} result - Result of the approval/rejection process
 * @returns {string} - Comment body
 */
function createCommentBody(summary, result) {
  const approvedFiles = result.approvedFiles || [];
  const rejectedFiles = result.rejectedFiles || [];
  
  let comment = `## TestivAI Visual Regression Report\n\n`;
  
  // Add summary section
  comment += `### Summary\n\n`;
  comment += `- Total Tests: ${summary.totalTests}\n`;
  comment += `- Passed Tests: ${summary.passedTests}\n`;
  comment += `- Failed Tests: ${summary.failedTests}\n`;
  comment += `- Approved Changes: ${summary.approvedChanges}\n`;
  comment += `- Rejected Changes: ${summary.rejectedChanges}\n\n`;
  
  // Add approved files section if any
  if (approvedFiles.length > 0) {
    comment += `### Approved Changes\n\n`;
    for (const file of approvedFiles) {
      comment += `- ✅ ${file}\n`;
    }
    comment += `\n`;
  }
  
  // Add rejected files section if any
  if (rejectedFiles.length > 0) {
    comment += `### Rejected Changes\n\n`;
    for (const file of rejectedFiles) {
      comment += `- ❌ ${file}\n`;
    }
    comment += `\n`;
  }
  
  // Add instructions for approving/rejecting
  comment += `### How to Approve/Reject Changes\n\n`;
  comment += `- To approve all changes: \`/approve-visuals\`\n`;
  comment += `- To approve a specific file: \`/approve-visuals filename.png\`\n`;
  comment += `- To reject a specific file: \`/reject-visuals filename.png\`\n\n`;
  
  // Add link to full report if available
  comment += `[View Full Report](../blob/HEAD/.testivai/visual-regression/report/index.html)\n`;
  
  return comment;
}

module.exports = {
  postReportComment
};
