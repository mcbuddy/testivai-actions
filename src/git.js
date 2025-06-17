const core = require('@actions/core');
const exec = require('@actions/exec');

/**
 * Commit and push changes to the repository
 * 
 * @param {string} message - Commit message
 * @param {string} committerName - Name of the committer
 * @param {string} committerEmail - Email of the committer
 * @returns {boolean} - Success status
 */
async function commitAndPush(message, committerName, committerEmail) {
  try {
    // Configure Git user
    core.info(`Setting Git user to ${committerName} <${committerEmail}>`);
    await exec.exec('git', ['config', 'user.name', committerName]);
    await exec.exec('git', ['config', 'user.email', committerEmail]);
    
    // Check if there are changes to commit
    let hasChanges = false;
    try {
      const options = {
        silent: true,
        listeners: {
          stdout: (data) => {
            if (data.toString().trim() !== '') {
              hasChanges = true;
            }
          }
        }
      };
      
      await exec.exec('git', ['status', '--porcelain'], options);
    } catch (error) {
      core.warning(`Failed to check Git status: ${error.message}`);
      // Assume there are changes and continue
      hasChanges = true;
    }
    
    if (!hasChanges) {
      core.info('No changes to commit');
      return true;
    }
    
    // Add all changes
    core.info('Adding changes to Git');
    await exec.exec('git', ['add', '.']);
    
    // Commit changes
    core.info(`Committing changes: ${message}`);
    await exec.exec('git', ['commit', '-m', message]);
    
    // Push changes
    core.info('Pushing changes to remote');
    await exec.exec('git', ['push']);
    
    core.info('Changes committed and pushed successfully');
    return true;
  } catch (error) {
    const errorMessage = `Git operation failed: ${error.message}`;
    core.setFailed(errorMessage);
    return false;
  }
}

module.exports = {
  commitAndPush
};
