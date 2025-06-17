const approvals = require('../src/approvals');
const fs = require('fs-extra');
const path = require('path');

// Mock fs-extra
jest.mock('fs-extra');

// Mock @actions/core
jest.mock('@actions/core', () => ({
  warning: jest.fn(),
  info: jest.fn()
}));

describe('Approvals Module', () => {
  const mockMetadata = {
    user: 'testuser',
    pr: 'https://github.com/owner/repo/pull/123',
    commit: 'abc123def456',
    timestamp: '2025-06-16T12:34:56Z'
  };
  
  const mockApprovalsPath = '.testivai/visual-regression/report/approvals.json';
  const mockReportPath = '.testivai/visual-regression/report/report.json';
  const mockDiffDirectory = '.testivai/visual-regression/report/diff';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    fs.ensureDir.mockResolvedValue(undefined);
    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({
      approved: [],
      rejected: [],
      new: [],
      deleted: [],
      meta: {}
    });
    fs.writeJson.mockResolvedValue(undefined);
    fs.readdir.mockResolvedValue(['image1.png', 'image2.png']);
  });
  
  describe('processApprovals', () => {
    test('should process specific file approvals', async () => {
      const files = ['login.png', 'profile.png'];
      
      const result = await approvals.processApprovals(
        files,
        mockMetadata,
        mockApprovalsPath,
        mockReportPath,
        mockDiffDirectory
      );
      
      // Check that directories were ensured
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(mockApprovalsPath));
      
      // Check that existing approvals were read
      expect(fs.pathExists).toHaveBeenCalledWith(mockApprovalsPath);
      expect(fs.readJson).toHaveBeenCalledWith(mockApprovalsPath);
      
      // Check that approvals were written
      expect(fs.writeJson).toHaveBeenCalledWith(
        mockApprovalsPath,
        {
          approved: ['login.png', 'profile.png'],
          rejected: [],
          new: [],
          deleted: [],
          meta: expect.objectContaining({
            author: mockMetadata.user,
            pr_url: mockMetadata.pr,
            commit_sha: mockMetadata.commit,
            timestamp: expect.any(String)
          })
        },
        { spaces: 2 }
      );
      
      // Check result
      expect(result).toEqual({
        approvedFiles: ['login.png', 'profile.png'],
        rejectedFiles: []
      });
    });
    
    test('should process global approvals', async () => {
      // Mock report.json data
      fs.readJson.mockImplementation((filePath) => {
        if (filePath === mockReportPath) {
          return {
            tests: [
              { status: 'failed', diffFile: 'test1.png' },
              { status: 'passed', diffFile: 'test2.png' },
              { status: 'failed', diffFile: 'test3.png' }
            ]
          };
        }
        return {
          approved: [],
          rejected: [],
          new: ['new1.png', 'new2.png'],
          deleted: [],
          meta: {}
        };
      });
      
      const result = await approvals.processApprovals(
        [],
        mockMetadata,
        mockApprovalsPath,
        mockReportPath,
        mockDiffDirectory
      );
      
      // Check that report.json was read
      expect(fs.readJson).toHaveBeenCalledWith(mockReportPath);
      
      // Check that approvals were written with all failed tests and new files
      expect(fs.writeJson).toHaveBeenCalledWith(
        mockApprovalsPath,
        {
          approved: ['test1.png', 'test3.png', 'new1.png', 'new2.png'],
          rejected: [],
          new: [],
          deleted: [],
          meta: expect.objectContaining({
            author: mockMetadata.user,
            pr_url: mockMetadata.pr,
            commit_sha: mockMetadata.commit,
            timestamp: expect.any(String)
          })
        },
        { spaces: 2 }
      );
      
      // Check result
      expect(result).toEqual({
        approvedFiles: ['test1.png', 'test3.png', 'new1.png', 'new2.png'],
        rejectedFiles: []
      });
    });
    
    test('should handle missing report.json by scanning diff directory', async () => {
      // Mock report.json not existing
      fs.pathExists.mockImplementation((filePath) => {
        if (filePath === mockReportPath) {
          return false;
        }
        return true;
      });
      
      const result = await approvals.processApprovals(
        [],
        mockMetadata,
        mockApprovalsPath,
        mockReportPath,
        mockDiffDirectory
      );
      
      // Check that diff directory was read
      expect(fs.readdir).toHaveBeenCalledWith(mockDiffDirectory);
      
      // Check that approvals were written with all diff files
      expect(fs.writeJson).toHaveBeenCalledWith(
        mockApprovalsPath,
        {
          approved: [
            path.join(mockDiffDirectory, 'image1.png'),
            path.join(mockDiffDirectory, 'image2.png')
          ],
          rejected: [],
          new: [],
          deleted: [],
          meta: expect.objectContaining({
            author: mockMetadata.user,
            pr_url: mockMetadata.pr,
            commit_sha: mockMetadata.commit,
            timestamp: expect.any(String)
          })
        },
        { spaces: 2 }
      );
      
      // Check result
      expect(result).toEqual({
        approvedFiles: [
          path.join(mockDiffDirectory, 'image1.png'),
          path.join(mockDiffDirectory, 'image2.png')
        ],
        rejectedFiles: []
      });
    });
    
    test('should handle errors gracefully', async () => {
      // Mock fs.writeJson to throw an error
      fs.writeJson.mockRejectedValue(new Error('Write error'));
      
      await expect(
        approvals.processApprovals(
          ['login.png'],
          mockMetadata,
          mockApprovalsPath,
          mockReportPath,
          mockDiffDirectory
        )
      ).rejects.toThrow('Failed to process approvals: Write error');
    });
  });
  
  describe('processRejections', () => {
    test('should process file rejections', async () => {
      const files = ['login.png'];
      
      const result = await approvals.processRejections(
        files,
        mockMetadata,
        mockApprovalsPath,
        mockReportPath
      );
      
      // Check that approvals were written
      expect(fs.writeJson).toHaveBeenCalledWith(
        mockApprovalsPath,
        {
          approved: [],
          rejected: ['login.png'],
          new: [],
          deleted: [],
          meta: expect.objectContaining({
            author: mockMetadata.user,
            pr_url: mockMetadata.pr,
            commit_sha: mockMetadata.commit,
            timestamp: expect.any(String)
          })
        },
        { spaces: 2 }
      );
      
      // Check result
      expect(result).toEqual({
        approvedFiles: [],
        rejectedFiles: ['login.png']
      });
    });
    
    test('should update existing entries', async () => {
      // Mock existing approvals
      fs.readJson.mockResolvedValue({
        approved: ['login.png'],
        rejected: [],
        new: [],
        deleted: [],
        meta: {}
      });
      
      const files = ['login.png'];
      
      const result = await approvals.processRejections(
        files,
        mockMetadata,
        mockApprovalsPath,
        mockReportPath
      );
      
      // Check that approvals were updated
      expect(fs.writeJson).toHaveBeenCalledWith(
        mockApprovalsPath,
        {
          approved: [],
          rejected: ['login.png'],
          new: [],
          deleted: [],
          meta: expect.objectContaining({
            author: mockMetadata.user,
            pr_url: mockMetadata.pr,
            commit_sha: mockMetadata.commit,
            timestamp: expect.any(String)
          })
        },
        { spaces: 2 }
      );
      
      // Check result
      expect(result).toEqual({
        approvedFiles: [],
        rejectedFiles: ['login.png']
      });
    });
  });
});
