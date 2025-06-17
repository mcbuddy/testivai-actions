const fs = require('fs-extra');
const path = require('path');
const core = require('@actions/core');

/**
 * Process visual regression approvals
 * 
 * @param {string[]} files - List of files to approve (empty for global approval)
 * @param {Object} metadata - PR metadata
 * @param {string} approvalsPath - Path to approvals.json
 * @param {string} reportPath - Path to report.json
 * @param {string} diffDirectory - Directory containing diff images
 * @returns {Object} - Result with approved files
 */
async function processApprovals(files, metadata, approvalsPath, reportPath, diffDirectory) {
  try {
    // Initialize result
    const result = {
      approvedFiles: [],
      rejectedFiles: []
    };
    
    // Ensure directories exist
    const approvalsDir = path.dirname(approvalsPath);
    await fs.ensureDir(approvalsDir);
    
    // Load existing approvals if available
    let approvalsData = {
      approved: [],
      rejected: [],
      new: [],
      deleted: [],
      meta: {}
    };
    
    try {
      if (await fs.pathExists(approvalsPath)) {
        approvalsData = await fs.readJson(approvalsPath);
      }
    } catch (error) {
      core.warning(`Could not read existing approvals file: ${error.message}`);
    }
    
    // Format metadata
    const formattedMetadata = {
      author: metadata.user,
      timestamp: new Date().toISOString(),
      source: `GitHub PR Comment`,
      pr_url: metadata.pr,
      commit_sha: metadata.commit,
      commit_url: `${metadata.pr.replace('/pull/', '/commit/')}/${metadata.commit}`
    };
    
    // Update metadata
    approvalsData.meta = {
      ...approvalsData.meta,
      ...formattedMetadata
    };
    
    // If specific files are provided, approve only those files
    if (files && files.length > 0) {
      for (const file of files) {
        // Remove from rejected if it exists there
        approvalsData.rejected = approvalsData.rejected.filter(f => f !== file);
        
        // Add to approved if not already there
        if (!approvalsData.approved.includes(file)) {
          approvalsData.approved.push(file);
        }
        
        result.approvedFiles.push(file);
      }
    } else {
      // Global approval - approve all unapproved diffs
      const diffFiles = await findAllDiffFiles(reportPath, diffDirectory);
      
      for (const file of diffFiles) {
        // Remove from rejected if it exists there
        approvalsData.rejected = approvalsData.rejected.filter(f => f !== file);
        
        // Add to approved if not already there
        if (!approvalsData.approved.includes(file)) {
          approvalsData.approved.push(file);
        }
        
        result.approvedFiles.push(file);
      }
      
      // Also approve all new files
      for (const file of approvalsData.new) {
        if (!approvalsData.approved.includes(file)) {
          approvalsData.approved.push(file);
          result.approvedFiles.push(file);
        }
      }
      
      // Clear the new array since all are now approved
      approvalsData.new = [];
    }
    
    // Save updated approvals
    await fs.writeJson(approvalsPath, approvalsData, { spaces: 2 });
    
    return result;
  } catch (error) {
    throw new Error(`Failed to process approvals: ${error.message}`);
  }
}

/**
 * Process visual regression rejections
 * 
 * @param {string[]} files - List of files to reject
 * @param {Object} metadata - PR metadata
 * @param {string} approvalsPath - Path to approvals.json
 * @param {string} reportPath - Path to report.json
 * @returns {Object} - Result with rejected files
 */
async function processRejections(files, metadata, approvalsPath, reportPath) {
  try {
    // Initialize result
    const result = {
      approvedFiles: [],
      rejectedFiles: []
    };
    
    // Ensure directories exist
    const approvalsDir = path.dirname(approvalsPath);
    await fs.ensureDir(approvalsDir);
    
    // Load existing approvals if available
    let approvalsData = {
      approved: [],
      rejected: [],
      new: [],
      deleted: [],
      meta: {}
    };
    
    try {
      if (await fs.pathExists(approvalsPath)) {
        approvalsData = await fs.readJson(approvalsPath);
      }
    } catch (error) {
      core.warning(`Could not read existing approvals file: ${error.message}`);
    }
    
    // Format metadata
    const formattedMetadata = {
      author: metadata.user,
      timestamp: new Date().toISOString(),
      source: `GitHub PR Comment`,
      pr_url: metadata.pr,
      commit_sha: metadata.commit,
      commit_url: `${metadata.pr.replace('/pull/', '/commit/')}/${metadata.commit}`
    };
    
    // Update metadata
    approvalsData.meta = {
      ...approvalsData.meta,
      ...formattedMetadata
    };
    
    // Reject specified files
    if (files && files.length > 0) {
      for (const file of files) {
        // Remove from approved if it exists there
        approvalsData.approved = approvalsData.approved.filter(f => f !== file);
        
        // Add to rejected if not already there
        if (!approvalsData.rejected.includes(file)) {
          approvalsData.rejected.push(file);
        }
        
        result.rejectedFiles.push(file);
      }
    }
    
    // Save updated approvals
    await fs.writeJson(approvalsPath, approvalsData, { spaces: 2 });
    
    return result;
  } catch (error) {
    throw new Error(`Failed to process rejections: ${error.message}`);
  }
}

/**
 * Find all diff files that need approval
 * 
 * @param {string} reportPath - Path to report.json
 * @param {string} diffDirectory - Directory containing diff images
 * @returns {string[]} - List of files that need approval
 */
async function findAllDiffFiles(reportPath, diffDirectory) {
  const files = [];
  
  // Try to get files from report.json first
  try {
    if (await fs.pathExists(reportPath)) {
      const reportData = await fs.readJson(reportPath);
      
      if (reportData.tests) {
        for (const test of reportData.tests) {
          if (test.status === 'failed' && test.diffFile) {
            files.push(test.diffFile);
          }
        }
      }
    }
  } catch (error) {
    core.warning(`Could not read report file: ${error.message}`);
  }
  
  // If no files found in report, try to scan diff directory
  if (files.length === 0 && diffDirectory) {
    try {
      if (await fs.pathExists(diffDirectory)) {
        const diffFiles = await fs.readdir(diffDirectory);
        
        for (const file of diffFiles) {
          if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            files.push(path.join(diffDirectory, file));
          }
        }
      }
    } catch (error) {
      core.warning(`Could not scan diff directory: ${error.message}`);
    }
  }
  
  return files;
}

module.exports = {
  processApprovals,
  processRejections
};
