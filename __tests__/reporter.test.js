const reporter = require('../src/reporter');

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');

describe('Reporter Module', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('postReportComment', () => {
    it('should post a report comment with GitHub Pages link to the PR', async () => {
      // Mock GitHub context
      const context = {
        repo: {
          owner: 'testivai',
          repo: 'testivai-visual-regression'
        },
        payload: {
          issue: {
            number: 42
          }
        }
      };

      // Mock Octokit
      const octokit = {
        rest: {
          issues: {
            createComment: jest.fn().mockResolvedValue({ data: { id: 123 } })
          }
        }
      };

      // Mock report path (not used in the updated implementation)
      const reportPath = '.testivai/visual-regression/report/report.json';

      // Mock result
      const result = {
        approvedFiles: ['image1.png', 'image2.png'],
        rejectedFiles: ['image3.png']
      };

      // Call the function
      const success = await reporter.postReportComment(octokit, context, reportPath, result);

      // Assertions
      expect(success).toBe(true);
      expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'testivai',
        repo: 'testivai-visual-regression',
        issue_number: 42,
        body: expect.stringContaining('TestivAI Visual Regression Report')
      });
      expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'testivai',
        repo: 'testivai-visual-regression',
        issue_number: 42,
        body: expect.stringContaining('https://testivai.github.io/testivai-visual-regression/pr-42/')
      });
    });

    it('should handle non-PR context', async () => {
      // Mock GitHub context without issue number
      const context = {
        repo: {
          owner: 'testivai',
          repo: 'testivai-visual-regression'
        },
        payload: {}
      };

      // Mock Octokit
      const octokit = {
        rest: {
          issues: {
            createComment: jest.fn()
          }
        }
      };

      // Mock report path
      const reportPath = '.testivai/visual-regression/report/report.json';

      // Mock result
      const result = {
        approvedFiles: ['image1.png'],
        rejectedFiles: []
      };

      // Call the function
      const success = await reporter.postReportComment(octokit, context, reportPath, result);

      // Assertions
      expect(success).toBe(false);
      expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    });
  });
});
