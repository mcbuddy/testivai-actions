#!/bin/bash
# Script to create a new release tag for the GitHub Action

# Ensure the script is run from the project root
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root directory"
  exit 1
fi

# Check if a version argument was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.0.0"
  exit 1
fi

VERSION=$1

# Validate version format (should start with 'v' followed by semver)
if ! [[ $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in format v1.0.0"
  exit 1
fi

# Update version in package.json
echo "Updating version in package.json..."
npm version ${VERSION#v} --no-git-tag-version

# Build the action
echo "Building the action..."
npm run build

# Create a release commit
echo "Creating release commit..."
git add package.json package-lock.json dist/
git commit -m "Release $VERSION"

# Create a tag
echo "Creating git tag $VERSION..."
git tag -a "$VERSION" -m "Release $VERSION"

# Instructions for pushing
echo ""
echo "Release $VERSION prepared!"
echo ""
echo "To complete the release, run:"
echo "  git push origin main"
echo "  git push origin $VERSION"
echo ""
echo "Then create a release on GitHub with the following information:"
echo "  Tag: $VERSION"
echo "  Title: TestivAI Visual Regression Approval Action $VERSION"
echo "  Description: Include release notes here"
echo ""
echo "To publish to GitHub Marketplace, check the 'Publish this Action to the GitHub Marketplace' box when creating the release."
