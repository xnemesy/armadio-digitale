#!/usr/bin/env node
/**
 * relocate-project.js
 *
 * Safely relocate this repo to a path WITHOUT spaces (e.g. from
 * "/Users/you/Documents/Android app/ArmadioDigitale" to
 * "/Users/you/Projects/ArmadioDigitale") and clean caches that
 * bake absolute paths.
 *
 * Why: CocoaPods/Xcode and some shell steps can choke on spaces in paths.
 * This script copies the project (including .git), excludes transient
 * build artifacts, and prints the follow-up steps.
 *
 * Usage examples:
 *   node scripts/relocate-project.js
 *   node scripts/relocate-project.js --dest ~/Projects/ArmadioDigitale
 *   node scripts/relocate-project.js -d /opt/dev/ArmadioDigitale --remove-old
 *
 * Flags:
 *   --dest, -d         Destination directory (must not exist). Defaults to
 *                      "$HOME/Projects/<current-folder-name>".
 *   --remove-old       After successful copy, delete the original folder.
 *   --force            Proceed even if current path has no spaces or git is dirty.
 *   --skip-git-check   Skip clean working tree check.
 *   --dry-run          Show what would happen without changing anything.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function log(msg) {
  console.log(`[relocate] ${msg}`);
}

function fail(msg, code = 1) {
  console.error(`\n[relocate] ERROR: ${msg}`);
  process.exit(code);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
  return res;
}

function runCapture(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    const out = res.stdout?.toString() || '';
    const err = res.stderr?.toString() || '';
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}\n${out}\n${err}`);
  }
  return res.stdout?.toString() || '';
}

// Parse args
const args = process.argv.slice(2);
const getArg = (name, alias) => {
  const idx = args.findIndex(a => a === `--${name}` || a === `-${alias}` || a.startsWith(`--${name}=`));
  if (idx === -1) return undefined;
  const a = args[idx];
  if (a.includes('=')) return a.split('=')[1];
  return args[idx + 1];
};
const hasFlag = (name) => args.includes(`--${name}`);

const force = hasFlag('force');
const removeOld = hasFlag('remove-old');
const skipGitCheck = hasFlag('skip-git-check');
const dryRun = hasFlag('dry-run');

const projectRoot = process.cwd();
const pkgJsonPath = path.join(projectRoot, 'package.json');
if (!fs.existsSync(pkgJsonPath)) {
  fail('Run this from the project root (package.json not found).');
}

const folderName = path.basename(projectRoot);
const defaultParent = path.join(os.homedir(), 'Projects');
const destArg = getArg('dest', 'd');
const destPath = path.resolve(destArg || path.join(defaultParent, folderName));

log(`Current path: ${projectRoot}`);
log(`Destination:  ${destPath}`);

if (destPath.includes(' ')) {
  fail('Destination path contains spaces — choose a path without spaces.');
}

const hasSpaceInCwd = projectRoot.includes(' ');
if (!hasSpaceInCwd && !force) {
  fail('Current path has no spaces. Use --force to relocate anyway.');
}

// Ensure git is present and working tree is clean (unless overridden)
let isGitRepo = false;
try {
  const res = runCapture('git', ['rev-parse', '--is-inside-work-tree'], { cwd: projectRoot });
  isGitRepo = res.trim() === 'true';
} catch (_) {
  isGitRepo = false;
}

if (isGitRepo && !skipGitCheck && !force) {
  const status = runCapture('git', ['status', '--porcelain'], { cwd: projectRoot });
  if (status.trim().length > 0) {
    fail('Git working tree is not clean. Commit/stash or pass --force or --skip-git-check.');
  }
}

// Prepare destination
if (fs.existsSync(destPath)) {
  const stat = fs.statSync(destPath);
  const isEmpty = stat.isDirectory() && fs.readdirSync(destPath).length === 0;
  if (!isEmpty) {
    fail('Destination already exists and is not empty. Choose a different --dest.');
  }
} else {
  fs.mkdirSync(destPath, { recursive: true });
}

// Exclude transient caches that embed absolute paths
const excludes = [
  'ios/Pods',
  'ios/build',
  'ios/DerivedData',
  'android/build',
  'android/app/build',
  'android/.gradle',
  'android/.cxx',
  '.expo',
  '.gradle',
  '*.log',
];

// Build rsync args
const rsyncArgs = [
  '-a', // archive mode
  '--info=NAME,STATS',
  '--delete-excluded',
  '--human-readable',
  ...excludes.flatMap((p) => ['--exclude', p]),
  projectRoot + '/', // trailing slash = copy contents only
  destPath,
];

log(`Copying project with rsync (excluding caches):\n  ${['rsync', ...rsyncArgs].join(' ')}`);
if (!dryRun) {
  try {
    run('rsync', rsyncArgs, { cwd: projectRoot });
  } catch (err) {
    fail(`rsync failed: ${err.message}`);
  }
}

// Verify copy
if (!fs.existsSync(path.join(destPath, 'package.json'))) {
  fail('Verification failed: package.json missing at destination.');
}
if (isGitRepo && !fs.existsSync(path.join(destPath, '.git'))) {
  fail('Verification failed: .git missing at destination.');
}

// Extra safety: ensure we didn't accidentally copy Pods/build dirs
const mustNotExist = [
  path.join(destPath, 'ios', 'Pods'),
  path.join(destPath, 'ios', 'build'),
  path.join(destPath, 'android', 'build'),
  path.join(destPath, 'android', 'app', 'build'),
];
for (const p of mustNotExist) {
  if (fs.existsSync(p)) {
    if (!dryRun) {
      log(`Removing transient dir at destination: ${p}`);
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      log(`[dry-run] Would remove: ${p}`);
    }
  }
}

// Optionally remove the original folder
if (removeOld) {
  const upOne = path.dirname(projectRoot);
  const backupPath = path.join(upOne, `${folderName}.backup`);
  if (!dryRun) {
    log(`Renaming original folder to backup: ${backupPath}`);
    try {
      fs.renameSync(projectRoot, backupPath);
      log('Original folder renamed to .backup. You can delete it after confirming the new copy works.');
    } catch (e) {
      fail(`Failed to rename original folder: ${e.message}`);
    }
  } else {
    log(`[dry-run] Would rename original folder to: ${backupPath}`);
  }
}

// Post instructions
const nextSteps = `
✅ Relocation prepared.

Next steps:
  1) cd "${destPath}"
  2) (optional) Reinstall deps to clear any lingering build caches:
       - npm install --legacy-peer-deps
       - npx pod-install  # or: (cd ios && pod install)
  3) Verify Firebase configs are restored (our post-install script takes care of this on EAS):
       - node scripts/restore-firebase-config.js
  4) Try a clean run:
       - npx expo run:ios   # on macOS
       - npx expo run:android

Notes:
  - We intentionally excluded Pods/build/.expo to avoid copying absolute-path caches.
  - Your Git history and remotes are preserved (we copied .git).
  - If everything looks good, you can delete the backup/original folder.
`;

console.log(nextSteps);
