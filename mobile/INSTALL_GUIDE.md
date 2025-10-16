# Mobile App Installation Guide

## Issue: NPM Permission Errors

You're experiencing npm cache permission issues. Here's how to fix it:

## Solution 1: Fix NPM Permissions (Recommended)

Run these commands in your terminal:

```bash
# Fix npm cache permissions
sudo chown -R $(whoami) ~/.npm

# Navigate to mobile directory
cd /Users/ethan/Desktop/Computer\ Science/Personal/Projects/Stashu/mobile

# Clean and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

## Solution 2: Use Yarn Instead (Alternative)

If npm continues to have issues, use yarn:

```bash
# Install yarn globally if you don't have it
npm install -g yarn

# Navigate to mobile directory
cd /Users/ethan/Desktop/Computer\ Science/Personal/Projects/Stashu/mobile

# Install with yarn
yarn install
```

## Solution 3: Manual Workspace Fix

The root package.json has workspaces configured. You can either:

### Option A: Remove mobile from root workspaces

Edit `/Users/ethan/Desktop/Computer Science/Personal/Projects/Stashu/package.json`:

```json
{
  "workspaces": [
    "backend",
    "web",
    "shared"
  ]
}
```

Then run:
```bash
cd mobile
npm install --legacy-peer-deps
```

### Option B: Install from root

```bash
cd /Users/ethan/Desktop/Computer\ Science/Personal/Projects/Stashu
npm install --workspace=mobile --legacy-peer-deps
```

## After Installation

Once dependencies are installed, you can start the app:

```bash
cd mobile
npm start
```

## Quick Test

To verify installation worked:

```bash
cd mobile
ls node_modules/@react-navigation
# You should see 'native' and 'native-stack' folders
```

## If All Else Fails

I can help you set up the mobile app using a different approach:
1. Create it outside the workspace
2. Use a simpler Expo template
3. Or manually install each dependency one by one

Let me know which solution works for you!
