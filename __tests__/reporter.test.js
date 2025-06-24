const reporter = require('../src/reporter');
const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('fs-extra');

describe('Reporter Module', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('postReportComment', () => {
    it('should post a report comment to the PR', async () => {
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

      // Mock report path
      const reportPath = '.testivai/visual-regression/report/report.json';
      const reportHtmlPath = '.testivai/visual-regression/report/index.html';

      // Mock fs.pathExists
      fs.pathExists.mockResolvedValue(true);

      // Mock fs.readFile
      const mockHtmlContent = `
        <html>
          <body>
            <div>Total Tests: 10</div>
            <div>Passed Tests: 8</div>
            <div>Failed Tests: 2</div>
          </body>
        </html>
      `;
      fs.readFile.mockResolvedValue(mockHtmlContent);

      // Mock result
      const result = {
        approvedFiles: ['image1.png', 'image2.png'],
        rejectedFiles: ['image3.png']
      };

      // Call the function
      const success = await reporter.postReportComment(octokit, context, reportPath, result);

      // Assertions
      expect(success).toBe(true);
      expect(fs.pathExists).toHaveBeenCalledWith(path.join(path.dirname(reportPath), 'index.html'));
      expect(fs.readFile).toHaveBeenCalledWith(path.join(path.dirname(reportPath), 'index.html'), 'utf8');
      expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'testivai',
        repo: 'testivai-visual-regression',
        issue_number: 42,
        body: expect.stringContaining('TestivAI Visual Regression Report')
      });
    });

    it('should handle missing report HTML', async () => {
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
            createComment: jest.fn()
          }
        }
      };

      // Mock report path
      const reportPath = '.testivai/visual-regression/report/report.json';

      // Mock fs.pathExists to return false (file not found)
      fs.pathExists.mockResolvedValue(false);

      // Mock result
      const result = {
        approvedFiles: ['image1.png'],
        rejectedFiles: []
      };

      // Call the function
      const success = await reporter.postReportComment(octokit, context, reportPath, result);

      // Assertions
      expect(success).toBe(false);
      expect(fs.pathExists).toHaveBeenCalledWith(path.join(path.dirname(reportPath), 'index.html'));
      expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
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
