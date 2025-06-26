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

/**
 * Execute TestivAI CLI to generate a report
 * 
 * @param {string} outputPath - Optional custom output path for the report
 * @returns {boolean} - Success status
 */
async function generateReport(outputPath) {
  try {
    // Check if TestivAI CLI is installed
    try {
      await io.which('testivai', true);
    } catch (error) {
      core.info('TestivAI CLI not found, attempting to install...');
      await installTestivAICLI();
    }
    
    // Prepare command arguments
    const args = ['report'];
    if (outputPath) {
      args.push('--out', outputPath);
    }
    
    // Execute TestivAI report command
    core.info(`Executing: testivai ${args.join(' ')}`);
    
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
    
    const exitCode = await exec.exec('testivai', args, options);
    
    if (exitCode !== 0) {
      throw new Error(`TestivAI CLI exited with code ${exitCode}: ${stderrData}`);
    }
    
    core.info('TestivAI report command executed successfully');
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
 * Execute TestivAI CLI to take snapshots
 * 
 * @returns {boolean} - Success status
 */
async function takeSnapshots() {
  try {
    // Check if TestivAI CLI is installed
    try {
      await io.which('testivai', true);
    } catch (error) {
      core.info('TestivAI CLI not found, attempting to install...');
      await installTestivAICLI();
    }
    
    // Execute TestivAI snapshot command
    core.info('Executing: testivai snapshot');
    
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
    
    const exitCode = await exec.exec('testivai', ['snapshot'], options);
    
    if (exitCode !== 0) {
      throw new Error(`TestivAI CLI exited with code ${exitCode}: ${stderrData}`);
    }
    
    core.info('TestivAI snapshot command executed successfully');
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
 * Execute TestivAI CLI to compare snapshots
 * 
 * @returns {boolean} - Success status
 */
async function compareSnapshots() {
  try {
    // Check if TestivAI CLI is installed
    try {
      await io.which('testivai', true);
    } catch (error) {
      core.info('TestivAI CLI not found, attempting to install...');
      await installTestivAICLI();
    }
    
    // Execute TestivAI compare command
    core.info('Executing: testivai compare');
    
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
    
    const exitCode = await exec.exec('testivai', ['compare'], options);
    
    if (exitCode !== 0) {
      throw new Error(`TestivAI CLI exited with code ${exitCode}: ${stderrData}`);
    }
    
    core.info('TestivAI compare command executed successfully');
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

module.exports = {
  approveVisuals,
  generateReport,
  takeSnapshots,
  compareSnapshots
};
