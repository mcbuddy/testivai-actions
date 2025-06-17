#!/usr/bin/env node

/**
 * Script to monitor usage of the TestivAI Visual Regression Approval Action
 * 
 * Usage: node scripts/monitor-usage.js <token> [days]
 * Example: node scripts/monitor-usage.js ghp_1234567890abcdef 30
 * 
 * This script will:
 * 1. Fetch recent workflow runs that used the action
 * 2. Analyze usage patterns
 * 3. Generate a report
 */

const https = require('https');

// Get command line arguments
const token = process.argv[2];
const days = parseInt(process.argv[3] || '30', 10);

if (!token) {
  console.error('Usage: node scripts/monitor-usage.js <token> [days]');
  console.error('Example: node scripts/monitor-usage.js ghp_1234567890abcdef 30');
  process.exit(1);
}

// Repository information
const owner = 'testivai'; // Replace with your GitHub username or organization
const repo = 'visual-approval-action'; // Replace with your repository name

// Calculate date range
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - days);

console.log(`Monitoring usage from ${startDate.toISOString()} to ${endDate.toISOString()}`);

// Fetch marketplace statistics
function fetchMarketplaceStats() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/marketplace/listing/stats/${owner}/${repo}`,
      method: 'GET',
      headers: {
        'User-Agent': 'TestivAI-Monitor-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch marketplace stats: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Fetch recent workflow runs
function fetchWorkflowRuns() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/actions/runs?created=${startDate.toISOString()}..${endDate.toISOString()}`,
      method: 'GET',
      headers: {
        'User-Agent': 'TestivAI-Monitor-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch workflow runs: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Fetch recent issues
function fetchIssues() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues?state=all&since=${startDate.toISOString()}`,
      method: 'GET',
      headers: {
        'User-Agent': 'TestivAI-Monitor-Script',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch issues: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Generate report
async function generateReport() {
  try {
    console.log('Fetching data...');
    
    // Fetch data in parallel
    const [marketplaceStats, workflowRuns, issues] = await Promise.all([
      fetchMarketplaceStats().catch(error => {
        console.warn(`Warning: ${error.message}`);
        return { installations: 0, accounts: { total: 0 } };
      }),
      fetchWorkflowRuns().catch(error => {
        console.warn(`Warning: ${error.message}`);
        return { workflow_runs: [] };
      }),
      fetchIssues().catch(error => {
        console.warn(`Warning: ${error.message}`);
        return [];
      })
    ]);
    
    // Process data
    const totalInstallations = marketplaceStats.installations || 0;
    const totalAccounts = marketplaceStats.accounts?.total || 0;
    
    const workflowRunsCount = workflowRuns.workflow_runs?.length || 0;
    const successfulRuns = workflowRuns.workflow_runs?.filter(run => run.conclusion === 'success').length || 0;
    const failedRuns = workflowRuns.workflow_runs?.filter(run => run.conclusion === 'failure').length || 0;
    
    const openIssues = issues.filter(issue => issue.state === 'open').length;
    const closedIssues = issues.filter(issue => issue.state === 'closed').length;
    
    // Generate report
    console.log('\n=== TestivAI Visual Regression Approval Action Usage Report ===\n');
    console.log(`Report Period: ${startDate.toDateString()} to ${endDate.toDateString()} (${days} days)\n`);
    
    console.log('Marketplace Statistics:');
    console.log(`- Total Installations: ${totalInstallations}`);
    console.log(`- Total Accounts: ${totalAccounts}\n`);
    
    console.log('Workflow Runs:');
    console.log(`- Total Runs: ${workflowRunsCount}`);
    console.log(`- Successful Runs: ${successfulRuns}`);
    console.log(`- Failed Runs: ${failedRuns}`);
    console.log(`- Success Rate: ${workflowRunsCount > 0 ? (successfulRuns / workflowRunsCount * 100).toFixed(2) : 0}%\n`);
    
    console.log('Issues:');
    console.log(`- Open Issues: ${openIssues}`);
    console.log(`- Closed Issues: ${closedIssues}`);
    console.log(`- Total Issues: ${openIssues + closedIssues}\n`);
    
    console.log('=== End of Report ===\n');
    
    console.log('Next Steps:');
    console.log('1. Review failed workflow runs to identify common issues');
    console.log('2. Address open issues');
    console.log('3. Consider feature requests based on user feedback');
    console.log('4. Update documentation based on common questions');
    
  } catch (error) {
    console.error(`Error generating report: ${error.message}`);
    process.exit(1);
  }
}

// Run the report
generateReport();
