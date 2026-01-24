# Release Process

This document describes how to create a new release for tBelt Finances.

## ⚠️ Important Rule

**NEVER** manually edit `package.json` files to bump versions. This leads to inconsistencies across the 4 versioned files in the repo:
1.  `package.json` (root)
2.  `server/package.json`
3.  `client/package.json`
4.  `client/src/config.js`
5.  `client/public/version.json`

## ✅ How to Release

We have an automated script to handle version bumping consistently.

### 1. Run the Bump Script

From the root directory:

```bash
# Usage: node scripts/bump_version.js <new_version>
node scripts/bump_version.js 1.6.4
```

Or using the npm script (if configured):

```bash
npm run release 1.6.4
```

This script will:
*   Update `version` in all `package.json` files.
*   Update `APP_VERSION` in `client/src/config.js`.
*   Update `version` in `client/public/version.json`.

### 2. Update Changelog

Update `whastNew` in:
*   `client/src/locales/en/translation.json`
*   `client/src/locales/es/translation.json`

### 3. Commit and Push

```bash
git add .
git commit -m "chore(release): bump version to 1.6.4"
git push origin master
```

### 4. Deploy

The CI/CD pipeline will detect the push and deploy automatically because version consistency checks will pass.
