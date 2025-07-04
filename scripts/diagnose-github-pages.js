const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fs = require('fs-extra');
const path = require('path');

/**
 * Diagnose issues with GitHub Pages deployment and PR comments
 */
async function diagnose() {
  console.log('🔍 Starting TestivAI GitHub Pages Diagnostics');
  console.log('=============================================');
  
  // Check environment
  console.log('\n📋 Checking Environment:');
  
  // Check if running in GitHub Actions
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  console.log(`- Running in GitHub Actions: ${isGitHubActions ? '✅' : '❌'}`);
  
  // Check GitHub token
  const hasToken = !!process.env.GITHUB_TOKEN;
  console.log(`- GitHub Token available: ${hasToken ? '✅' : '❌'}`);
  
  // Check if in PR context
  let prNumber;
  const context = github.context;
  
  if (context.payload.pull_request) {
    prNumber = context.payload.pull_request.number;
  } else if (context.payload.issue && context.payload.issue.pull_request) {
    prNumber = context.payload.issue.number;
  } else if (process.env.PR_NUMBER) {
    prNumber = process.env.PR_NUMBER;
  } else {
    const prMatch = context.ref && context.ref.match(/refs\/pull\/(\d+)\/merge/);
    if (prMatch) {
      prNumber = prMatch[1];
    }
  }
  
  console.log(`- PR Context: ${prNumber ? `✅ (PR #${prNumber})` : '❌'}`);
  
  // Check TestivAI CLI
  console.log('\n📋 Checking TestivAI CLI:');
  let testivaiInstalled = false;
  
  try {
    await exec.exec('testivai', ['--version'], { silent: true });
    testivaiInstalled = true;
    console.log('- TestivAI CLI installed: ✅');
  } catch (error) {
    console.log('- TestivAI CLI installed: ❌');
    console.log(`  Error: ${error.message}`);
  }
  
  // Check GitHub Pages setup
  console.log('\n📋 Checking GitHub Pages Setup:');
  
  // Check if gh-pages directory exists
  const ghPagesDir = path.join(process.cwd(), 'gh-pages');
  const ghPagesExists = await fs.pathExists(ghPagesDir);
  console.log(`- gh-pages directory exists: ${ghPagesExists ? '✅' : '❌'}`);
  
  // If PR number is available, check PR-specific directory
  if (prNumber && ghPagesExists) {
    const prDir = path.join(ghPagesDir, `pr-${prNumber}`);
    const prDirExists = await fs.pathExists(prDir);
    console.log(`- PR-specific directory exists: ${prDirExists ? '✅' : '❌'}`);
    
    if (prDirExists) {
      // Check for index.html
      const indexHtml = path.join(prDir, 'index.html');
      const indexHtmlExists = await fs.pathExists(indexHtml);
      console.log(`- index.html exists in PR directory: ${indexHtmlExists ? '✅' : '❌'}`);
    }
  }
  
  // Construct expected GitHub Pages URL
  if (prNumber) {
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const pagesUrl = `https://${owner}.github.io/${repo}/pr-${prNumber}/`;
    console.log(`\n📋 Expected GitHub Pages URL:`);
    console.log(`- ${pagesUrl}`);
  }
  
  // Provide troubleshooting guidance
  console.log('\n📋 Troubleshooting Recommendations:');
  
  if (!isGitHubActions) {
    console.log('- This script should be run in a GitHub Actions workflow');
  }
  
  if (!hasToken) {
    console.log('- Add GITHUB_TOKEN to your workflow:');
    console.log('  ```yaml');
    console.log('  env:');
    console.log('    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    console.log('  ```');
  }
  
  if (!prNumber) {
    console.log('- Ensure you are running in a PR context or provide PR_NUMBER environment variable');
  }
  
  if (!testivaiInstalled) {
    console.log('- Install TestivAI CLI:');
    console.log('  ```bash');
    console.log('  npm install -g testivai');
    console.log('  ```');
  }
  
  if (!ghPagesExists) {
    console.log('- Create gh-pages directory:');
    console.log('  ```bash');
    console.log('  mkdir -p ./gh-pages');
    console.log('  ```');
  }
  
  console.log('\n📋 GitHub Pages Configuration:');
  console.log('- Ensure GitHub Pages is enabled in your repository settings');
  console.log('- Check that your workflow has the correct permissions:');
  console.log('  ```yaml');
  console.log('  permissions:');
  console.log('    contents: read');
  console.log('    pages: write');
  console.log('    id-token: write');
  console.log('    issues: write');
  console.log('    pull-requests: write');
  console.log('  ```');
  console.log('- Verify your workflow has the correct environment:');
  console.log('  ```yaml');
  console.log('  environment:');
  console.log('    name: github-pages');
  console.log('    url: ${{ steps.deployment.outputs.page_url }}');
  console.log('  ```');
  
  console.log('\n📋 PR Comment Posting:');
  console.log('- Check workflow logs for any errors when posting PR comments');
  console.log('- Ensure your workflow has the correct permissions for commenting on PRs');
  
  console.log('\n=============================================');
  console.log('🔍 Diagnostics Complete');
}

// Run the diagnostics
diagnose().catch(error => {
  console.error(`Error running diagnostics: ${error.message}`);
  process.exit(1);
});
