const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');
const fs = require('fs-extra');

/**
 * Execute TestivAI CLI to approve visual changes
 * 
 * @param {string} approvalsPath - Path to approvals.json file
 * @returns {boolean} - Success status
 */
async function approveVisuals(approvalsPath) {
  try {
    // Check if approvals file exists
    if (!await fs.pathExists(approvalsPath)) {
      core.warning(`Approvals file not found at ${approvalsPath}`);
      return false;
    }
    
    // Check if TestivAI CLI is installed
    try {
      await io.which('testivai', true);
    } catch (error) {
      core.info('TestivAI CLI not found, attempting to install...');
      await installTestivAICLI();
    }
    
    // Execute TestivAI approve command
    core.info(`Executing: testivai approve --from ${approvalsPath}`);
    
    let stdoutData = '';
    let stderrData = '';
    
    const options = {
      listeners: {
        stdout: (data) => {
          stdoutData += data.toString();
        },
        stderr: (data) => {
          stderrData += data.toString();
        }
      }
    };
    
    const exitCode = await exec.exec('testivai', ['approve', '--from', approvalsPath], options);
    
    if (exitCode !== 0) {
      throw new Error(`TestivAI CLI exited with code ${exitCode}: ${stderrData}`);
    }
    
    core.info('TestivAI approve command executed successfully');
    if (stdoutData) {
      core.info(`Output: ${stdoutData}`);
    }
    
    return true;
  } catch (error) {
    const errorMessage = `TestivAI CLI error: ${error.message}`;
    core.setFailed(errorMessage);
    return false;
  }
}

/**
 * Install TestivAI CLI if not already installed
 * 
 * @returns {boolean} - Success status
 */
async function installTestivAICLI() {
  try {
    core.info('Installing TestivAI CLI...');
    
    // Try npm installation first
    try {
      await exec.exec('npm', ['install', '-g', 'testivai']);
      return true;
    } catch (npmError) {
      core.warning(`npm installation failed: ${npmError.message}`);
      
      // Try yarn as fallback
      try {
        await exec.exec('yarn', ['global', 'add', 'testivai']);
        return true;
      } catch (yarnError) {
        throw new Error('Failed to install TestivAI CLI using npm or yarn');
      }
    }
  } catch (error) {
    const errorMessage = `Failed to install TestivAI CLI: ${error.message}`;
    core.setFailed(errorMessage);
    throw error; // Re-throw to be caught by the calling function
  }
}

module.exports = {
  approveVisuals
};
