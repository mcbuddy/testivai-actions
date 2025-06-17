# Technical Context: TestivAI Visual Regression Approval GitHub Action

## Technologies Used

### Core Technologies
- **Node.js**: Runtime environment for the action
- **JavaScript/ECMAScript**: Primary programming language
- **GitHub Actions**: Execution environment and workflow system
- **Git**: Version control system for managing changes

### Supporting Technologies
- **JSON**: Data format for approvals and configuration
- **TestivAI CLI**: Command-line interface for TestivAI operations
- **GitHub REST API**: For interacting with GitHub resources
- **GitHub Webhooks**: For receiving comment events

## Development Setup

### Local Development Environment
- **Node.js**: v16 or later (matches GitHub Actions runtime)
- **npm**: For package management
- **Git**: For version control
- **GitHub CLI**: For testing GitHub integrations locally
- **Jest**: For unit and integration testing
- **ESLint**: For code quality and style enforcement

### GitHub Actions Environment
- **Runner**: Ubuntu latest (primary target)
- **Node.js**: v16 (GitHub Actions default)
- **Checkout Action**: For accessing repository content
- **GitHub Token**: For authentication and API access

### Testing Environment
- **Jest**: For unit tests
- **Nock**: For mocking HTTP requests
- **Mock File System**: For testing file operations
- **GitHub Actions Runner**: For integration testing

## Technical Constraints

### GitHub Actions Constraints
- **Execution Time**: Limited to 6 hours per workflow run
- **Storage**: Limited disk space on runners
- **Memory**: Limited RAM on runners
- **Network**: Potential rate limiting for GitHub API calls
- **Secrets Management**: GitHub-specific approach required

### TestivAI Constraints
- **CLI Compatibility**: Must work with current TestivAI CLI version
- **File Structure**: Must adhere to TestivAI's expected directory structure
- **Approval Format**: Must generate compatible approval records

### Security Constraints
- **Token Permissions**: Minimal required permissions for GitHub token
- **Input Validation**: Must sanitize and validate all user inputs
- **Error Handling**: Must fail securely without exposing sensitive information

## Dependencies

### Runtime Dependencies
- **@actions/core**: GitHub Actions core functionality
- **@actions/github**: GitHub API client for Actions
- **@actions/exec**: For executing shell commands
- **@actions/io**: For file system operations
- **node-fetch**: For HTTP requests (if needed)
- **fs-extra**: Enhanced file system operations

### Development Dependencies
- **jest**: Testing framework
- **eslint**: Code linting
- **prettier**: Code formatting
- **nock**: HTTP mocking
- **@vercel/ncc**: For bundling the action

## Tool Usage Patterns

### GitHub Actions Workflow
```yaml
# Example workflow usage
name: TestivAI Visual Regression Approval
on:
  issue_comment:
    types: [created]

jobs:
  process-approval:
    runs-on: ubuntu-latest
    if: contains(github.event.comment.body, '/approve-visuals') || contains(github.event.comment.body, '/reject-visuals')
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.pull_request.head.ref }}
      
      - name: Process visual approval/rejection
        uses: testivai/visual-approval-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### TestivAI CLI Integration
```javascript
// Example of executing TestivAI CLI
const { exec } = require('@actions/exec');

async function approveVisuals(approvalsPath) {
  try {
    await exec('testivai', ['approve', '--from', approvalsPath]);
    return true;
  } catch (error) {
    core.setFailed(`TestivAI CLI error: ${error.message}`);
    return false;
  }
}
```

### Approvals JSON Structure
```json
{
  "meta": {
    "user": "github-username",
    "pr": "https://github.com/owner/repo/pull/123",
    "commit": "abc123def456",
    "timestamp": "2025-06-16T12:34:56Z"
  },
  "approvals": [
    {
      "file": "path/to/image.png",
      "status": "approved",
      "timestamp": "2025-06-16T12:34:56Z"
    }
  ]
}
```

### Git Operations
```javascript
// Example of Git operations
async function commitAndPush(message, committerName, committerEmail) {
  try {
    await exec('git', ['config', 'user.name', committerName]);
    await exec('git', ['config', 'user.email', committerEmail]);
    await exec('git', ['add', '.']);
    await exec('git', ['commit', '-m', message]);
    await exec('git', ['push']);
    return true;
  } catch (error) {
    core.setFailed(`Git operation failed: ${error.message}`);
    return false;
  }
}
```

## File Structure

```
testivai-actions/
├── .github/
│   └── workflows/
│       └── testivai-approve.yml  # Example workflow
├── action.yml                    # Action metadata
├── index.js                      # Main entry point
├── src/
│   ├── parser.js                 # Comment parsing logic
│   ├── approvals.js              # Approvals management
│   ├── git.js                    # Git operations
│   └── testivai.js               # TestivAI CLI wrapper
├── __tests__/                    # Test files
│   ├── parser.test.js
│   ├── approvals.test.js
│   └── integration.test.js
└── README.md                     # Documentation
```

## Development Workflow

1. **Setup**: Clone repository and install dependencies
2. **Development**: Implement features with TDD approach
3. **Testing**: Run unit and integration tests
4. **Building**: Bundle the action using ncc
5. **Release**: Tag and publish new versions
6. **Documentation**: Update README and examples

## Deployment and Distribution

- **GitHub Marketplace**: Primary distribution channel
- **Versioning**: Semantic versioning with major version tags
- **Release Process**: GitHub Releases with detailed changelogs
- **Distribution Format**: Bundled JavaScript with dependencies
