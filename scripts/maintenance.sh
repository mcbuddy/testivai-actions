#!/bin/bash
# Script to help with maintenance tasks for the TestivAI Visual Regression Approval Action

# Display help information
function show_help {
  echo "TestivAI Visual Regression Approval Action Maintenance Script"
  echo ""
  echo "This script helps with common maintenance tasks for the TestivAI Visual Regression Approval Action."
  echo ""
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  update-deps        Update dependencies to latest versions"
  echo "  check-deps         Check for outdated dependencies"
  echo "  lint               Run ESLint to check code quality"
  echo "  format             Run Prettier to format code"
  echo "  test               Run tests"
  echo "  coverage           Run tests with coverage report"
  echo "  build              Build the action"
  echo "  clean              Clean build artifacts"
  echo "  help               Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 update-deps"
  echo "  $0 test"
  echo ""
}

# Check if a command was provided
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

# Process command
command="$1"
case $command in
  update-deps)
    echo "Updating dependencies to latest versions..."
    npm update
    npm outdated
    echo "Dependencies updated."
    ;;
    
  check-deps)
    echo "Checking for outdated dependencies..."
    npm outdated
    ;;
    
  lint)
    echo "Running ESLint..."
    npm run lint
    ;;
    
  format)
    echo "Running Prettier..."
    npm run format
    ;;
    
  test)
    echo "Running tests..."
    npm test
    ;;
    
  coverage)
    echo "Running tests with coverage report..."
    npm run test -- --coverage
    echo "Coverage report generated in ./coverage/"
    ;;
    
  build)
    echo "Building the action..."
    npm run build
    ;;
    
  clean)
    echo "Cleaning build artifacts..."
    rm -rf dist
    rm -rf coverage
    rm -rf node_modules/.cache
    echo "Build artifacts cleaned."
    ;;
    
  help)
    show_help
    ;;
    
  *)
    echo "Unknown command: $command"
    show_help
    exit 1
    ;;
esac

echo ""
echo "Maintenance task completed."
