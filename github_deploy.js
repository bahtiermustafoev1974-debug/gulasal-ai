const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

async function deploy(token, username) {
  if (!token || !username) {
    console.error('Usage: node github_deploy.js <GITHUB_TOKEN> <GITHUB_USERNAME>');
    process.exit(1);
  }

  const dir = path.resolve(__dirname);
  console.log(`[1/3] Creating repository on GitHub for ${username}...`);

  try {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Gulasal-AI-Deployer'
      },
      body: JSON.stringify({
        name: 'gulasal-ai',
        description: 'Gulasal AI — Shaxsiy sun’iy intellekt ta’lim platformasi',
        private: false,
        auto_init: false
      })
    });

    const data = await res.json();
    if (res.status === 201) {
      console.log('Repository created:', data.html_url);
    } else if (data.message && data.message.includes('already exists')) {
      console.log('Repository gulasal-ai already exists, proceeding to push...');
    } else {
      console.warn('API Notice:', data.message || data);
    }
  } catch (err) {
    console.warn('Repo check warning:', err.message);
  }

  console.log('[2/3] Setting remote origin and main branch...');
  const remoteUrl = `https://github.com/${username}/gulasal-ai.git`;

  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (e) {
    console.warn('Branch main notice:', e.message);
  }

  try {
    await git.deleteRemote({ fs, dir, remote: 'origin' });
  } catch {}

  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: remoteUrl
  });

  console.log('[3/3] Pushing to GitHub (main branch)...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token, password: '' })
  });

  console.log('SUCCESS! Code pushed to:', remoteUrl);
  console.log('Push result:', pushResult);
}

const [,, token, username] = process.argv;
if (token && username) {
  deploy(token, username).catch(err => console.error('Deploy error:', err));
} else {
  console.log('github_deploy.js ready. Pass <GITHUB_TOKEN> and <GITHUB_USERNAME> to deploy.');
}
