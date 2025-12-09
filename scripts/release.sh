#!/bin/bash

# Script to create a new release
# Usage: ./scripts/release.sh [major|minor|patch]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version type is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify version type (major, minor, or patch)${NC}"
    echo "Usage: ./scripts/release.sh [major|minor|patch]"
    exit 1
fi

VERSION_TYPE=$1

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Error: Invalid version type. Use major, minor, or patch${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting release process...${NC}"

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${GREEN}$CURRENT_VERSION${NC}"

# Calculate new version
case $VERSION_TYPE in
    major)
        NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1+1".0.0"}')
        ;;
    minor)
        NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1"."$2+1".0"}')
        ;;
    patch)
        NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1"."$2"."$3+1}')
        ;;
esac

echo -e "New version will be: ${GREEN}$NEW_VERSION${NC}"
echo ""
read -p "Continue with this version? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Release cancelled${NC}"
    exit 1
fi

# Update version in package.json
echo -e "${YELLOW}Updating package.json...${NC}"
npm version $NEW_VERSION --no-git-tag-version

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm test

# Compile TypeScript
echo -e "${YELLOW}Compiling TypeScript...${NC}"
npm run compile

# Package extension
echo -e "${YELLOW}Packaging extension...${NC}"
npm run package

# Git operations
echo -e "${YELLOW}Committing changes...${NC}"
git add package.json package-lock.json
git commit -m "chore: bump version to $NEW_VERSION"

echo -e "${YELLOW}Creating git tag...${NC}"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo ""
echo -e "${GREEN}✓ Release prepared successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes"
echo "2. Push the commit and tag:"
echo -e "   ${GREEN}git push origin main${NC}"
echo -e "   ${GREEN}git push origin v$NEW_VERSION${NC}"
echo ""
echo "The GitHub Action will automatically:"
echo "  - Create a GitHub release"
echo "  - Upload the .vsix file"
echo "  - Publish to OpenVSX (if token is configured)"
