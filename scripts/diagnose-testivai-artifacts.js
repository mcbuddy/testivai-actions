const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

/**
 * Diagnose issues with TestivAI artifacts and GitHub Pages deployment
 */
async function diagnoseArtifacts() {
  console.log('🔍 Starting TestivAI Artifacts Diagnostics');
  console.log('=============================================');
  
  // Check TestivAI CLI
  console.log('\n📋 Checking TestivAI CLI:');
  let testivaiInstalled = false;
  let testivaiVersion = '';
  
  try {
    let output = '';
    await exec.exec('npx', ['testivai', '--version'], {
      silent: true,
      listeners: {
        stdout: (data) => {
          output += data.toString();
        }
      }
    });
    testivaiInstalled = true;
    testivaiVersion = output.trim();
    console.log(`- TestivAI CLI installed: ✅ (Version: ${testivaiVersion})`);
  } catch (error) {
    console.log('- TestivAI CLI installed: ❌');
    console.log(`  Error: ${error.message}`);
  }
  
  // Check TestivAI configuration
  console.log('\n📋 Checking TestivAI Configuration:');
  const configFiles = [
    '.testivai.json',
    '.testivai.js',
    '.testivai.config.js',
    'testivai.config.js'
  ];
  
  let configFound = false;
  let configPath = '';
  
  for (const file of configFiles) {
    if (await fs.pathExists(file)) {
      configFound = true;
      configPath = file;
      break;
    }
  }
  
  console.log(`- TestivAI configuration file: ${configFound ? `✅ (${configPath})` : '❌'}`);
  
  if (configFound) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      console.log('- Configuration content:');
      console.log(`\n${configContent}\n`);
    } catch (error) {
      console.log(`- Error reading configuration: ${error.message}`);
    }
  }
  
  // Check TestivAI output directories
  console.log('\n📋 Checking TestivAI Output Directories:');
  
  const testivaiDir = '.testivai';
  const testivaiExists = await fs.pathExists(testivaiDir);
  console.log(`- .testivai directory exists: ${testivaiExists ? '✅' : '❌'}`);
  
  if (testivaiExists) {
    try {
      const testivaiContents = await fs.readdir(testivaiDir);
      console.log(`- .testivai contents: ${testivaiContents.join(', ')}`);
      
      // Check visual-regression directory
      const vrDir = path.join(testivaiDir, 'visual-regression');
      const vrExists = await fs.pathExists(vrDir);
      console.log(`- visual-regression directory exists: ${vrExists ? '✅' : '❌'}`);
      
      if (vrExists) {
        const vrContents = await fs.readdir(vrDir);
        console.log(`- visual-regression contents: ${vrContents.join(', ')}`);
        
        // Check report directory
        const reportDir = path.join(vrDir, 'report');
        const reportExists = await fs.pathExists(reportDir);
        console.log(`- report directory exists: ${reportExists ? '✅' : '❌'}`);
        
        if (reportExists) {
          const reportContents = await fs.readdir(reportDir);
          console.log(`- report contents: ${reportContents.join(', ')}`);
          
          // Check for report.json
          const reportJson = path.join(reportDir, 'report.json');
          const reportJsonExists = await fs.pathExists(reportJson);
          console.log(`- report.json exists: ${reportJsonExists ? '✅' : '❌'}`);
          
          // Check for index.html
          const indexHtml = path.join(reportDir, 'index.html');
          const indexHtmlExists = await fs.pathExists(indexHtml);
          console.log(`- index.html exists: ${indexHtmlExists ? '✅' : '❌'}`);
        }
      }
    } catch (error) {
      console.log(`- Error reading TestivAI directories: ${error.message}`);
    }
  }
  
  // Check GitHub Pages directories
  console.log('\n📋 Checking GitHub Pages Directories:');
  
  const ghPagesDir = 'gh-pages';
  const ghPagesExists = await fs.pathExists(ghPagesDir);
  console.log(`- gh-pages directory exists: ${ghPagesExists ? '✅' : '❌'}`);
  
  if (ghPagesExists) {
    try {
      const ghPagesContents = await fs.readdir(ghPagesDir);
      console.log(`- gh-pages contents: ${ghPagesContents.join(', ')}`);
      
      // Check for PR-specific directories
      const prDirs = ghPagesContents.filter(item => item.startsWith('pr-'));
      console.log(`- PR-specific directories: ${prDirs.length > 0 ? prDirs.join(', ') : 'None found'}`);
      
      // Check for index.html in gh-pages
      const indexHtml = path.join(ghPagesDir, 'index.html');
      const indexHtmlExists = await fs.pathExists(indexHtml);
      console.log(`- index.html exists in gh-pages: ${indexHtmlExists ? '✅' : '❌'}`);
      
      // Check file sizes
      console.log('\n📋 Checking File Sizes:');
      
      try {
        // Find all HTML files
        const htmlFiles = glob.sync(`${ghPagesDir}/**/*.html`);
        console.log(`- Found ${htmlFiles.length} HTML files`);
        
        // Find all image files
        const imageFiles = glob.sync(`${ghPagesDir}/**/*.{png,jpg,jpeg,gif}`);
        console.log(`- Found ${imageFiles.length} image files`);
        
        // Check for large files
        const largeFiles = [];
        
        for (const file of [...htmlFiles, ...imageFiles]) {
          const stats = await fs.stat(file);
          const sizeMB = stats.size / (1024 * 1024);
          
          if (sizeMB > 10) {
            largeFiles.push({ file, size: sizeMB.toFixed(2) });
          }
        }
        
        if (largeFiles.length > 0) {
          console.log('- Large files detected (>10MB):');
          for (const { file, size } of largeFiles) {
            console.log(`  - ${file}: ${size} MB`);
          }
        } else {
          console.log('- No unusually large files detected');
        }
      } catch (error) {
        console.log(`- Error checking file sizes: ${error.message}`);
      }
    } catch (error) {
      console.log(`- Error reading gh-pages directory: ${error.message}`);
    }
  }
  
  // Provide troubleshooting guidance
  console.log('\n📋 Troubleshooting Recommendations:');
  
  if (!testivaiInstalled) {
    console.log('- Install TestivAI CLI:');
    console.log('  ```bash');
    console.log('  npm install -g testivai');
    console.log('  ```');
  }
  
  if (!configFound) {
    console.log('- Create a TestivAI configuration file:');
    console.log('  ```bash');
    console.log('  echo \'{ "snapshots": { "directory": ".testivai/visual-regression/snapshots" } }\' > .testivai.json');
    console.log('  ```');
  }
  
  if (!testivaiExists) {
    console.log('- Create TestivAI directories:');
    console.log('  ```bash');
    console.log('  mkdir -p .testivai/visual-regression/snapshots');
    console.log('  mkdir -p .testivai/visual-regression/report');
    console.log('  ```');
  }
  
  if (!ghPagesExists) {
    console.log('- Create GitHub Pages directory:');
    console.log('  ```bash');
    console.log('  mkdir -p ./gh-pages');
    console.log('  ```');
  }
  
  console.log('\n📋 Common TestivAI Artifact Issues:');
  console.log('1. **Missing TestivAI Configuration**: Create a .testivai.json file with proper configuration');
  console.log('2. **Incorrect Output Paths**: Ensure the --out flag points to the correct directory');
  console.log('3. **Large Artifacts**: Check for unusually large files that might cause upload issues');
  console.log('4. **Permission Issues**: Ensure the workflow has write permissions for artifacts');
  console.log('5. **GitHub Pages Not Enabled**: Enable GitHub Pages in repository settings');
  
  console.log('\n📋 Fixing Upload Artifact Issues:');
  console.log('1. **Check Artifact Size**: GitHub has a 2GB limit for artifacts');
  console.log('   - If your artifacts are too large, consider excluding large files or using compression');
  console.log('2. **Verify Directory Structure**:');
  console.log('   - Ensure the gh-pages directory exists and contains the expected files');
  console.log('   - Make sure the path in upload-pages-artifact action is correct');
  console.log('3. **Check Workflow Permissions**:');
  console.log('   - Ensure the workflow has the necessary permissions for GitHub Pages');
  console.log('4. **Modify TestivAI Output**:');
  console.log('   - Use the --out flag to control where TestivAI generates reports');
  console.log('   - Example: `npx testivai report --out ./gh-pages/pr-123`');
  
  console.log('\n=============================================');
  console.log('🔍 Diagnostics Complete');
}

// Run the diagnostics
diagnoseArtifacts().catch(error => {
  console.error(`Error running diagnostics: ${error.message}`);
  process.exit(1);
});
