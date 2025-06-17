#!/usr/bin/env node

/**
 * Script to create a GitHub release for the TestivAI Visual Regression Approval Action
 * 
 * Usage: node scripts/create-github-release.js <version> <token>
 * Example: node scripts/create-github-release.js v1.0.0 ghp_1234567890abcdef
 * 
 * Prerequisites:
 * - You must have already created a tag using the create-release.sh script
 * - You must have a GitHub personal access token with 'repo' scope
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get command line arguments
const version = process.argv[2];
const token = process.argv[3];

if (!version || !token) {
  console.error('Usage: node scripts/create-github-release.js <version> <token>');
  console.error('Example: node scripts/create-github-release.js v1.0.0 ghp_1234567890abcdef');
  process.exit(1);
}

// Validate version format
if (!/^v\d+\.\d+\.\d+$/.test(version)) {
  console.error('Error: Version must be in format v1.0.0');
  process.exit(1);
}

// Repository information
const owner = 'testivai'; // Replace with your GitHub username or organization
const repo = 'visual-approval-action'; // Replace with your repository name

// Read release notes template
const releaseNotesPath = path.join(__dirname, 'release-notes-template.md');
let releaseNotes;

try {
  releaseNotes = fs.readFileSync(releaseNotesPath, 'utf8');
  
  // Replace version placeholder
  releaseNotes = releaseNotes.replace(/v1\.0\.0/g, version);
} catch (error) {
  console.error(`Error reading release notes template: ${error.message}`);
  process.exit(1);
}

// Prepare release data
const releaseData = {
  tag_name: version,
  name: `TestivAI Visual Regression Approval Action ${version}`,
  body: releaseNotes,
  draft: true, // Create as draft so you can review before publishing
  prerelease: false,
  generate_release_notes: false
};

// Create release
console.log(`Creating GitHub release for ${version}...`);

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/releases`,
  method: 'POST',
  headers: {
    'User-Agent': 'TestivAI-Release-Script',
    'Content-Type': 'application/json',
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
      const response = JSON.parse(data);
      console.log(`✅ Draft release created successfully!`);
      console.log(`Release URL: ${response.html_url}`);
      console.log(`\nNext steps:`);
      console.log(`1. Review the draft release at the URL above`);
      console.log(`2. Make any necessary changes to the release notes`);
      console.log(`3. Check the "Publish this Action to the GitHub Marketplace" box if desired`);
      console.log(`4. Click "Publish release" when ready`);
    } else {
      console.error(`❌ Failed to create release: ${res.statusCode} ${res.statusMessage}`);
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Error creating release: ${error.message}`);
});

req.write(JSON.stringify(releaseData));
req.end();
