# Release Scripts

This directory contains automation scripts for releasing new versions of the extension.

## Scripts

### `release.sh`

Automates the entire release process including version bumping, testing, packaging, and git tagging.

**Usage:**
```bash
./scripts/release.sh [major|minor|patch]
```

**Examples:**
```bash
# Patch release (1.0.3 → 1.0.4)
./scripts/release.sh patch

# Minor release (1.0.3 → 1.1.0)
./scripts/release.sh minor

# Major release (1.0.3 → 2.0.0)
./scripts/release.sh major
```

**What it does:**
1. Calculates the new version number
2. Updates `package.json`
3. Runs tests to ensure everything works
4. Compiles TypeScript
5. Packages the extension (.vsix)
6. Creates a git commit with the version change
7. Creates a git tag (e.g., `v1.0.4`)
8. Provides instructions for pushing to GitHub

**After running the script:**
```bash
# Push the commit and tag to trigger the GitHub Action
git push origin main
git push origin v1.0.4
```

The GitHub Action will automatically:
- Create a GitHub release
- Upload the `.vsix` file
- Publish to OpenVSX (if `OPENVSX_TOKEN` secret is configured)
- Publish to VS Code Marketplace (if `VSCE_TOKEN` secret is configured)

## GitHub Secrets

To enable automatic publishing to marketplaces, add the following secrets to your GitHub repository:

### OpenVSX Token

1. Go to https://open-vsx.org/user-settings/tokens
2. Generate a new token
3. Go to your repository on GitHub
4. Settings → Secrets and variables → Actions
5. Click "New repository secret"
6. Name: `OPENVSX_TOKEN`
7. Value: Your OpenVSX Personal Access Token

### VS Code Marketplace Token

1. Go to https://dev.azure.com/
2. Create an organization if you don't have one
3. User Settings (top right) → Personal Access Tokens
4. Click "New Token"
   - Name: `vsce-publish`
   - Organization: All accessible organizations
   - Scopes: **Marketplace** → **Manage**
5. Copy the token
6. Go to your repository on GitHub
7. Settings → Secrets and variables → Actions
8. Click "New repository secret"
9. Name: `VSCE_TOKEN`
10. Value: Your Azure DevOps Personal Access Token

## Manual Release

If you prefer to create releases manually:

1. Update version in `package.json`
2. Run tests: `npm test`
3. Compile: `npm run compile`
4. Package: `npm run package`
5. Commit and tag:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to X.Y.Z"
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin main
   git push origin vX.Y.Z
   ```
