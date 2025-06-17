#!/bin/bash
# Script to help with testing the TestivAI Visual Regression Approval Action in a real GitHub repository

# Display help information
function show_help {
  echo "TestivAI Visual Regression Approval Action Test Script"
  echo ""
  echo "This script helps with testing the TestivAI Visual Regression Approval Action"
  echo "in a real GitHub repository."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -r, --repo PATH       Path to the test repository (required)"
  echo "  -b, --branch NAME     Branch name to create for testing (default: test-visual-approval)"
  echo "  -i, --image NAME      Image file to modify for testing (required)"
  echo "  -h, --help            Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --repo ~/projects/my-website --image src/assets/header.png"
  echo ""
}

# Default values
BRANCH_NAME="test-visual-approval"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -r|--repo)
      REPO_PATH="$2"
      shift
      shift
      ;;
    -b|--branch)
      BRANCH_NAME="$2"
      shift
      shift
      ;;
    -i|--image)
      IMAGE_PATH="$2"
      shift
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Check required parameters
if [ -z "$REPO_PATH" ]; then
  echo "Error: Repository path is required"
  show_help
  exit 1
fi

if [ -z "$IMAGE_PATH" ]; then
  echo "Error: Image path is required"
  show_help
  exit 1
fi

# Check if repository exists
if [ ! -d "$REPO_PATH" ]; then
  echo "Error: Repository directory does not exist: $REPO_PATH"
  exit 1
fi

# Check if image exists
FULL_IMAGE_PATH="$REPO_PATH/$IMAGE_PATH"
if [ ! -f "$FULL_IMAGE_PATH" ]; then
  echo "Error: Image file does not exist: $FULL_IMAGE_PATH"
  exit 1
fi

# Navigate to repository
echo "Navigating to repository: $REPO_PATH"
cd "$REPO_PATH" || exit 1

# Check if repository is a git repository
if [ ! -d ".git" ]; then
  echo "Error: Not a git repository: $REPO_PATH"
  exit 1
fi

# Check if TestivAI is set up
if [ ! -d ".testivai" ]; then
  echo "Error: TestivAI is not set up in this repository"
  echo "Please set up TestivAI first"
  exit 1
fi

# Create a new branch
echo "Creating new branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Modify the image
echo "Modifying image: $IMAGE_PATH"
# This is a simple modification that will change the image
# In a real scenario, you would make actual UI changes
convert "$IMAGE_PATH" -fill white -draw "rectangle 10,10 50,50" "$IMAGE_PATH"

# Commit the changes
echo "Committing changes"
git add "$IMAGE_PATH"
git commit -m "Test: Modify image for visual regression testing"

# Push the branch
echo "Pushing branch to remote"
git push -u origin "$BRANCH_NAME"

# Create a pull request
echo "Creating pull request"
PR_URL=$(gh pr create --title "Test: Visual regression changes" --body "This PR contains changes for testing the TestivAI Visual Regression Approval Action." --head "$BRANCH_NAME")

echo ""
echo "Test setup completed!"
echo ""
echo "Next steps:"
echo "1. Run TestivAI visual regression tests on the PR"
echo "2. Once visual differences are detected, comment on the PR with:"
echo "   /approve-visuals"
echo "   or"
echo "   /approve-visuals $IMAGE_PATH"
echo ""
echo "Pull Request URL: $PR_URL"
echo ""
echo "To clean up after testing:"
echo "1. Close and delete the PR"
echo "2. Delete the branch: git branch -D $BRANCH_NAME && git push origin --delete $BRANCH_NAME"
echo ""
