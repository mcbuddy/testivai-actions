const git = require('../src/git');
const exec = require('@actions/exec');
const core = require('@actions/core');

// Mock @actions/exec
jest.mock('@actions/exec');

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  setFailed: jest.fn()
}));

describe('Git Module', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    exec.exec.mockResolvedValue(0);
  });
  
  describe('commitAndPush', () => {
    test('should configure git user and commit changes', async () => {
      // Mock git status to indicate changes
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'git' && args[0] === 'status') {
          if (options && options.listeners && options.listeners.stdout) {
            options.listeners.stdout('M file1.txt\n');
          }
          return 0;
        }
        return 0;
      });
      
      const message = 'Update visual regression baselines';
      const committerName = 'testuser';
      const committerEmail = 'testuser@users.noreply.github.com';
      
      const result = await git.commitAndPush(message, committerName, committerEmail);
      
      // Check that git commands were executed in the correct order
      expect(exec.exec.mock.calls).toEqual([
        ['git', ['config', 'user.name', committerName]],
        ['git', ['config', 'user.email', committerEmail]],
        ['git', ['status', '--porcelain'], expect.any(Object)],
        ['git', ['add', '.']],
        ['git', ['commit', '-m', message]],
        ['git', ['push']]
      ]);
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith(`Setting Git user to ${committerName} <${committerEmail}>`);
      expect(core.info).toHaveBeenCalledWith('Adding changes to Git');
      expect(core.info).toHaveBeenCalledWith(`Committing changes: ${message}`);
      expect(core.info).toHaveBeenCalledWith('Pushing changes to remote');
      expect(core.info).toHaveBeenCalledWith('Changes committed and pushed successfully');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should skip commit if no changes detected', async () => {
      // Mock git status to indicate no changes
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'git' && args[0] === 'status') {
          if (options && options.listeners && options.listeners.stdout) {
            options.listeners.stdout('');
          }
          return 0;
        }
        return 0;
      });
      
      const message = 'Update visual regression baselines';
      const committerName = 'testuser';
      const committerEmail = 'testuser@users.noreply.github.com';
      
      const result = await git.commitAndPush(message, committerName, committerEmail);
      
      // Check that only git config and status commands were executed
      expect(exec.exec.mock.calls).toEqual([
        ['git', ['config', 'user.name', committerName]],
        ['git', ['config', 'user.email', committerEmail]],
        ['git', ['status', '--porcelain'], expect.any(Object)]
      ]);
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith(`Setting Git user to ${committerName} <${committerEmail}>`);
      expect(core.info).toHaveBeenCalledWith('No changes to commit');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should handle git command errors', async () => {
      // Mock git push to fail
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'git' && args[0] === 'status') {
          if (options && options.listeners && options.listeners.stdout) {
            options.listeners.stdout('M file1.txt\n');
          }
          return 0;
        }
        if (command === 'git' && args[0] === 'push') {
          throw new Error('Push failed');
        }
        return 0;
      });
      
      const message = 'Update visual regression baselines';
      const committerName = 'testuser';
      const committerEmail = 'testuser@users.noreply.github.com';
      
      const result = await git.commitAndPush(message, committerName, committerEmail);
      
      // Check that error was reported
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Push failed'));
      
      // Check result
      expect(result).toBe(false);
    });
    
    test('should handle git status check errors', async () => {
      // Mock git status to fail
      exec.exec.mockImplementation((command, args) => {
        if (command === 'git' && args[0] === 'status') {
          throw new Error('Status check failed');
        }
        return 0;
      });
      
      const message = 'Update visual regression baselines';
      const committerName = 'testuser';
      const committerEmail = 'testuser@users.noreply.github.com';
      
      const result = await git.commitAndPush(message, committerName, committerEmail);
      
      // Check that warning was logged but process continued
      expect(core.warning).toHaveBeenCalledWith('Failed to check Git status: Status check failed');
      
      // Check that remaining git commands were executed
      expect(exec.exec.mock.calls).toEqual([
        ['git', ['config', 'user.name', committerName]],
        ['git', ['config', 'user.email', committerEmail]],
        ['git', ['status', '--porcelain'], expect.any(Object)],
        ['git', ['add', '.']],
        ['git', ['commit', '-m', message]],
        ['git', ['push']]
      ]);
      
      // Check result
      expect(result).toBe(true);
    });
  });
});
