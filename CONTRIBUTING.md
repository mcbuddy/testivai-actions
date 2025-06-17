# Contributing to TestivAI Visual Regression Approval Action

Thank you for your interest in contributing to the TestivAI Visual Regression Approval Action! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and considerate of others.

## How Can I Contribute?

### Reporting Bugs

If you encounter a bug, please create an issue using the bug report template. Include as much detail as possible:

1. Steps to reproduce the issue
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Relevant logs
6. Environment details

### Suggesting Enhancements

Have an idea for a new feature or improvement? Create an issue using the feature request template. Be sure to:

1. Clearly describe the feature
2. Explain why it would be valuable
3. Outline how it might work
4. Provide examples of use cases

### Pull Requests

We welcome pull requests! To submit a pull request:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Add or update tests as necessary
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request using the PR template

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Setup Steps

1. Clone your fork of the repository
   ```
   git clone https://github.com/YOUR-USERNAME/testivai-visual-approval-action.git
   cd testivai-visual-approval-action
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run tests
   ```
   npm test
   ```

## Coding Guidelines

### JavaScript Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint` to check your code
- Run `npm run format` to automatically format your code

### Testing

- All new features should include tests
- Run `npm test` to run the test suite
- Aim for high test coverage

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in the present tense (e.g., "Add feature" not "Added feature")
- Reference issue numbers when applicable (e.g., "Fix #123: Add error handling")

## Release Process

1. We use semantic versioning (MAJOR.MINOR.PATCH)
2. The release script can be used to create a new release:
   ```
   ./scripts/create-release.sh v1.0.0
   ```

## Documentation

- Update the README.md if your changes affect how users interact with the action
- Add JSDoc comments to functions and classes
- Keep documentation up to date with code changes

## Questions?

If you have any questions about contributing, feel free to open an issue with the "question" label.

Thank you for contributing to the TestivAI Visual Regression Approval Action!
