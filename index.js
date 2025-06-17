const core = require('@actions/core');
const github = require('@actions/github');
const parser = require('./src/parser');
const approvals = require('./src/approvals');
const git = require('./src/git');
const testivai = require('./src/testivai');

/**
 * Main function to process visual regression approvals/rejections
 */
async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const approvalsPath = core.getInput('approvals-path');
    const reportPath = core.getInput('report-path');
    const diffDirectory = core.getInput('diff-directory');
    const commitMessage = core.getInput('commit-message');

    // Initialize GitHub client
    const octokit = github.getOctokit(token);
    
    // Get event payload
    const eventName = github.context.eventName;
    const payload = github.context.payload;
    
    // Validate event type
    if (eventName !== 'issue_comment' || !payload.issue.pull_request) {
      core.setFailed('This action only works on PR comments');
      return;
    }
    
    // Parse the comment
    const commentBody = payload.comment.body;
    const command = parser.parseComment(commentBody);
    
    if (!command) {
      core.info('No valid approval/rejection command found in comment');
      return;
    }
    
    core.info(`Detected command: ${command.type} for ${command.files.length > 0 ? command.files.join(', ') : 'all files'}`);
    
    // Get PR metadata
    const prMetadata = {
      user: payload.comment.user.login,
      pr: `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/pull/${payload.issue.number}`,
      commit: github.context.sha,
      timestamp: new Date().toISOString()
    };
    
    // Process approvals/rejections
    let result;
    if (command.type === 'approve') {
      result = await approvals.processApprovals(command.files, prMetadata, approvalsPath, reportPath, diffDirectory);
    } else if (command.type === 'reject') {
      result = await approvals.processRejections(command.files, prMetadata, approvalsPath, reportPath);
    }
    
    // Set outputs
    core.setOutput('approved-files', JSON.stringify(result.approvedFiles || []));
    core.setOutput('rejected-files', JSON.stringify(result.rejectedFiles || []));
    
    // Run TestivAI CLI to update baselines if there are approvals
    if (result.approvedFiles && result.approvedFiles.length > 0) {
      await testivai.approveVisuals(approvalsPath);
    }
    
    // Commit and push changes
    const committerName = payload.comment.user.login;
    const committerEmail = `${payload.comment.user.login}@users.noreply.github.com`;
    
    await git.commitAndPush(commitMessage, committerName, committerEmail);
    
    core.setOutput('result', 'success');
    core.info('Visual regression changes processed successfully');
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    core.setOutput('result', 'failure');
  }
}

// Run the action
run();
