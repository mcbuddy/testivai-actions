const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Generate and post a comment with a link to the visual regression report on GitHub Pages
 * 
 * @param {Object} octokit - GitHub API client
 * @param {Object} context - GitHub context
 * @param {string} reportPath - Path to the report directory (not used in this implementation)
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

    const prNumber = context.payload.issue.number;
    
    // Construct the GitHub Pages URL for this PR
    const pagesUrl = `https://${context.repo.owner}.github.io/${context.repo.repo}/pr-${prNumber}/`;
    
    // Create the comment body with a link to the GitHub Pages report
    const commentBody = createCommentBody(pagesUrl, result);
    
    // Post the comment to the PR
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: commentBody
    });
    
    core.info(`Posted report comment to PR #${prNumber} with link to GitHub Pages report: ${pagesUrl}`);
    return true;
  } catch (error) {
    core.warning(`Failed to post report comment: ${error.message}`);
    return false;
  }
}

/**
 * Create the comment body with a link to the GitHub Pages report
 * 
 * @param {string} pagesUrl - URL to the GitHub Pages report
 * @param {Object} result - Result of the approval/rejection process
 * @returns {string} - Comment body
 */
function createCommentBody(pagesUrl, result) {
  const approvedFiles = result?.approvedFiles || [];
  const rejectedFiles = result?.rejectedFiles || [];
  
  let comment = `## TestivAI Visual Regression Report\n\n`;
  
  // Add link to the GitHub Pages report
  comment += `🧪 **[View Full Report on GitHub Pages](${pagesUrl})**\n\n`;
  
  // Add brief summary if available
  if (result) {
    comment += `### Summary\n\n`;
    if (approvedFiles.length > 0) {
      comment += `- ✅ ${approvedFiles.length} file(s) approved\n`;
    }
    if (rejectedFiles.length > 0) {
      comment += `- ❌ ${rejectedFiles.length} file(s) rejected\n`;
    }
    comment += `\n`;
  }
  
  // Add instructions for approving/rejecting
  comment += `### How to Approve/Reject Changes\n\n`;
  comment += `- To approve all changes: \`/approve-visuals\`\n`;
  comment += `- To approve a specific file: \`/approve-visuals filename.png\`\n`;
  comment += `- To reject a specific file: \`/reject-visuals filename.png\`\n\n`;
  
  return comment;
}

module.exports = {
  postReportComment
};
