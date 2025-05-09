#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

function getGitInfo(dir) {
  try {
    const output = execSync('git status -b --porcelain', {
      cwd: dir,
      encoding: 'utf8'
    });

    const lines = output.split('\n');
    const branchLine = lines[0].trim();
    const changes = lines.slice(1).some(line => line.trim() !== '');

    const branchMatch = branchLine.match(/^## ([^\s.]+)(\.{3}|$)/);
    const branch = branchMatch ? branchMatch[1] : '(unknown)';

    return {
      branch,
      dirty: changes
    };
  } catch (err) {
    return null;
  }
}

function pad(str, length) {
  return str.padEnd(length, ' ');
}

function main() {
  const baseDir = process.argv[2];
  if (!baseDir) {
    console.error('Usage: lsrepos <directory>');
    process.exit(1);
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subdir = path.join(baseDir, entry.name);
      if (isGitRepo(subdir)) {
        const info = getGitInfo(subdir);
        if (info) {
          results.push({
            name: entry.name,
            branch: info.branch,
            status: info.dirty ? 'changed' : ''
          });
        }

        else throw new Error("Can't get git info for "+entry.name);
      }

      else {
          results.push({
            name: entry.name,
            branch: "<not repo>",
            status: ""
          });

      }
    }
  }

  // Format output as a table
  const nameColWidth = Math.max(...results.map(r => r.name.length), 10);
  const branchColWidth = Math.max(...results.map(r => r.branch.length), 10);

  console.log(pad('Subdir', nameColWidth) + '  ' + pad('Branch', branchColWidth) + '  Status');
  console.log('-'.repeat(nameColWidth + branchColWidth + 10));

  for (const r of results) {
    console.log(
      pad(r.name, nameColWidth) + '  ' +
      pad(r.branch, branchColWidth) + '  ' +
      r.status
    );
  }
}

main();