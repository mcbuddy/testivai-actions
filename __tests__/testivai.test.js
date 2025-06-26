const testivai = require('../src/testivai');
const exec = require('@actions/exec');
const io = require('@actions/io');
const core = require('@actions/core');
const fs = require('fs-extra');

// Mock dependencies
jest.mock('@actions/exec');
jest.mock('@actions/io');
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  setFailed: jest.fn()
}));
jest.mock('fs-extra');

describe('TestivAI Module', () => {
  const mockApprovalsPath = '.testivai/visual-regression/report/approvals.json';
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    exec.exec.mockResolvedValue(0);
    io.which.mockResolvedValue('/usr/local/bin/testivai');
    fs.pathExists.mockResolvedValue(true);
  });
  
  describe('approveVisuals', () => {
    test('should execute TestivAI CLI with correct parameters', async () => {
      // Setup mock for exec.exec to capture stdout
      exec.exec.mockImplementation((command, args, options) => {
        if (options && options.listeners && options.listeners.stdout) {
          options.listeners.stdout('Successfully approved 2 images\n');
        }
        return 0;
      });
      
      const result = await testivai.approveVisuals(mockApprovalsPath);
      
      // Check that file existence was verified
      expect(fs.pathExists).toHaveBeenCalledWith(mockApprovalsPath);
      
      // Check that TestivAI CLI was checked
      expect(io.which).toHaveBeenCalledWith('testivai', true);
      
      // Check that TestivAI CLI was executed with correct args
      expect(exec.exec).toHaveBeenCalledWith(
        'testivai',
        ['approve', '--from', mockApprovalsPath],
        expect.any(Object)
      );
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith(`Executing: testivai approve --from ${mockApprovalsPath}`);
      expect(core.info).toHaveBeenCalledWith('TestivAI approve command executed successfully');
      expect(core.info).toHaveBeenCalledWith('Output: Successfully approved 2 images\n');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should handle missing approvals file', async () => {
      // Mock approvals file not existing
      fs.pathExists.mockResolvedValue(false);
      
      const result = await testivai.approveVisuals(mockApprovalsPath);
      
      // Check that warning was logged
      expect(core.warning).toHaveBeenCalledWith(`Approvals file not found at ${mockApprovalsPath}`);
      
      // Check that TestivAI CLI was not executed
      expect(exec.exec).not.toHaveBeenCalled();
      
      // Check result
      expect(result).toBe(false);
    });
    
    test('should install TestivAI CLI if not found', async () => {
      // Mock TestivAI CLI not found, then successful npm install
      io.which.mockRejectedValue(new Error('Command not found'));
      
      const result = await testivai.approveVisuals(mockApprovalsPath);
      
      // Check that installation was attempted
      expect(core.info).toHaveBeenCalledWith('TestivAI CLI not found, attempting to install...');
      expect(core.info).toHaveBeenCalledWith('Installing TestivAI CLI...');
      expect(exec.exec).toHaveBeenCalledWith('npm', ['install', '-g', 'testivai']);
      
      // Check that TestivAI CLI was executed after installation
      expect(exec.exec).toHaveBeenCalledWith(
        'testivai',
        ['approve', '--from', mockApprovalsPath],
        expect.any(Object)
      );
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should try yarn if npm install fails', async () => {
      // Mock TestivAI CLI not found, npm install fails, yarn succeeds
      io.which.mockRejectedValue(new Error('Command not found'));
      exec.exec.mockImplementation((command, args) => {
        if (command === 'npm') {
          throw new Error('npm install failed');
        }
        return 0;
      });
      
      const result = await testivai.approveVisuals(mockApprovalsPath);
      
      // Check that npm installation was attempted
      expect(exec.exec).toHaveBeenCalledWith('npm', ['install', '-g', 'testivai']);
      
      // Check that warning was logged
      expect(core.warning).toHaveBeenCalledWith('npm installation failed: npm install failed');
      
      // Check that yarn installation was attempted
      expect(exec.exec).toHaveBeenCalledWith('yarn', ['global', 'add', 'testivai']);
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should handle TestivAI CLI execution errors', async () => {
      // Mock TestivAI CLI execution failure
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'testivai') {
          if (options && options.listeners && options.listeners.stderr) {
            options.listeners.stderr('Error: Could not process approvals\n');
          }
          return 1;
        }
        return 0;
      });
      
      const result = await testivai.approveVisuals(mockApprovalsPath);
      
      // Check that error was reported
      expect(core.setFailed).toHaveBeenCalledWith('TestivAI CLI error: TestivAI CLI exited with code 1: Error: Could not process approvals\n');
      
      // Check result
      expect(result).toBe(false);
    });
    
    test('should handle installation failures', async () => {
      // Mock TestivAI CLI not found, both npm and yarn fail
      io.which.mockRejectedValue(new Error('Command not found'));
      exec.exec.mockImplementation((command) => {
        if (command === 'npm') {
          throw new Error('npm install failed');
        }
        if (command === 'yarn') {
          throw new Error('yarn install failed');
        }
        return 0;
      });
      
      const result = await testivai.approveVisuals(mockApprovalsPath);
      
      // Check that error was reported
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Failed to install TestivAI CLI'));
      
      // Check result
      expect(result).toBe(false);
    });
  });
  
  describe('generateReport', () => {
    test('should execute TestivAI CLI report command with default output path', async () => {
      // Setup mock for exec.exec to capture stdout
      exec.exec.mockImplementation((command, args, options) => {
        if (options && options.listeners && options.listeners.stdout) {
          options.listeners.stdout('Report generated successfully\n');
        }
        return 0;
      });
      
      const result = await testivai.generateReport();
      
      // Check that TestivAI CLI was checked
      expect(io.which).toHaveBeenCalledWith('testivai', true);
      
      // Check that TestivAI CLI was executed with correct args
      expect(exec.exec).toHaveBeenCalledWith(
        'testivai',
        ['report'],
        expect.any(Object)
      );
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith('Executing: testivai report');
      expect(core.info).toHaveBeenCalledWith('TestivAI report command executed successfully');
      expect(core.info).toHaveBeenCalledWith('Output: Report generated successfully\n');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should execute TestivAI CLI report command with custom output path', async () => {
      // Setup mock for exec.exec to capture stdout
      exec.exec.mockImplementation((command, args, options) => {
        if (options && options.listeners && options.listeners.stdout) {
          options.listeners.stdout('Report generated successfully\n');
        }
        return 0;
      });
      
      const customOutputPath = './custom/report/path';
      const result = await testivai.generateReport(customOutputPath);
      
      // Check that TestivAI CLI was checked
      expect(io.which).toHaveBeenCalledWith('testivai', true);
      
      // Check that TestivAI CLI was executed with correct args
      expect(exec.exec).toHaveBeenCalledWith(
        'testivai',
        ['report', '--out', customOutputPath],
        expect.any(Object)
      );
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith(`Executing: testivai report --out ${customOutputPath}`);
      expect(core.info).toHaveBeenCalledWith('TestivAI report command executed successfully');
      expect(core.info).toHaveBeenCalledWith('Output: Report generated successfully\n');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should handle TestivAI CLI execution errors for report command', async () => {
      // Mock TestivAI CLI execution failure
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'testivai') {
          if (options && options.listeners && options.listeners.stderr) {
            options.listeners.stderr('Error: Could not generate report\n');
          }
          return 1;
        }
        return 0;
      });
      
      const result = await testivai.generateReport();
      
      // Check that error was reported
      expect(core.setFailed).toHaveBeenCalledWith('TestivAI CLI error: TestivAI CLI exited with code 1: Error: Could not generate report\n');
      
      // Check result
      expect(result).toBe(false);
    });
  });
  
  describe('takeSnapshots', () => {
    test('should execute TestivAI CLI snapshot command', async () => {
      // Setup mock for exec.exec to capture stdout
      exec.exec.mockImplementation((command, args, options) => {
        if (options && options.listeners && options.listeners.stdout) {
          options.listeners.stdout('Snapshots taken successfully\n');
        }
        return 0;
      });
      
      const result = await testivai.takeSnapshots();
      
      // Check that TestivAI CLI was checked
      expect(io.which).toHaveBeenCalledWith('testivai', true);
      
      // Check that TestivAI CLI was executed with correct args
      expect(exec.exec).toHaveBeenCalledWith(
        'testivai',
        ['snapshot'],
        expect.any(Object)
      );
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith('Executing: testivai snapshot');
      expect(core.info).toHaveBeenCalledWith('TestivAI snapshot command executed successfully');
      expect(core.info).toHaveBeenCalledWith('Output: Snapshots taken successfully\n');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should handle TestivAI CLI execution errors for snapshot command', async () => {
      // Mock TestivAI CLI execution failure
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'testivai') {
          if (options && options.listeners && options.listeners.stderr) {
            options.listeners.stderr('Error: Could not take snapshots\n');
          }
          return 1;
        }
        return 0;
      });
      
      const result = await testivai.takeSnapshots();
      
      // Check that error was reported
      expect(core.setFailed).toHaveBeenCalledWith('TestivAI CLI error: TestivAI CLI exited with code 1: Error: Could not take snapshots\n');
      
      // Check result
      expect(result).toBe(false);
    });
  });
  
  describe('compareSnapshots', () => {
    test('should execute TestivAI CLI compare command', async () => {
      // Setup mock for exec.exec to capture stdout
      exec.exec.mockImplementation((command, args, options) => {
        if (options && options.listeners && options.listeners.stdout) {
          options.listeners.stdout('Snapshots compared successfully\n');
        }
        return 0;
      });
      
      const result = await testivai.compareSnapshots();
      
      // Check that TestivAI CLI was checked
      expect(io.which).toHaveBeenCalledWith('testivai', true);
      
      // Check that TestivAI CLI was executed with correct args
      expect(exec.exec).toHaveBeenCalledWith(
        'testivai',
        ['compare'],
        expect.any(Object)
      );
      
      // Check that info messages were logged
      expect(core.info).toHaveBeenCalledWith('Executing: testivai compare');
      expect(core.info).toHaveBeenCalledWith('TestivAI compare command executed successfully');
      expect(core.info).toHaveBeenCalledWith('Output: Snapshots compared successfully\n');
      
      // Check result
      expect(result).toBe(true);
    });
    
    test('should handle TestivAI CLI execution errors for compare command', async () => {
      // Mock TestivAI CLI execution failure
      exec.exec.mockImplementation((command, args, options) => {
        if (command === 'testivai') {
          if (options && options.listeners && options.listeners.stderr) {
            options.listeners.stderr('Error: Could not compare snapshots\n');
          }
          return 1;
        }
        return 0;
      });
      
      const result = await testivai.compareSnapshots();
      
      // Check that error was reported
      expect(core.setFailed).toHaveBeenCalledWith('TestivAI CLI error: TestivAI CLI exited with code 1: Error: Could not compare snapshots\n');
      
      // Check result
      expect(result).toBe(false);
    });
  });
});
