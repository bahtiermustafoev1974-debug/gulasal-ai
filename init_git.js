const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

async function main() {
  const dir = path.resolve(__dirname);
  console.log('Initializing git repository in:', dir);
  await git.init({ fs, dir, defaultBranch: 'main' });
  console.log('Git repo initialized with defaultBranch: main.');

  // List of files to add
  const filesToAdd = [];
  function scan(currentDir, relativePath = '') {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (
        item === 'node_modules' ||
        item === '.git' ||
        item === '.env' ||
        item === 'cloudflared.exe' ||
        item.endsWith('.zip') ||
        item.endsWith('.log') ||
        item === '.vercel'
      ) continue;

      const fullPath = path.join(currentDir, item);
      const rel = relativePath ? `${relativePath}/${item}` : item;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath, rel);
      } else {
        filesToAdd.push(rel);
      }
    }
  }

  scan(dir);
  console.log(`Found ${filesToAdd.length} files to track (excluding .env and node_modules).`);

  for (const f of filesToAdd) {
    await git.add({ fs, dir, filepath: f });
  }
  console.log('Added all files to staging.');

  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Bahtier Mustafoev',
      email: 'bahtiermustafoev1974@gmail.com'
    },
    message: 'Production release: Gulasal AI Platform v7.0'
  });

  console.log('Committed successfully. SHA:', sha);
}

main().catch(err => {
  console.error('Error:', err);
});
