#!/usr/bin/env node
// Simple cross-platform setup script to create .env.local
// for non-developers: asks for your Gemini API key and writes the file.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envExamplePath = path.join(projectRoot, '.env.example');

async function prompt(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

function ensureFromExample() {
  if (!fs.existsSync(envExamplePath)) return '';
  try {
    return fs.readFileSync(envExamplePath, 'utf8');
  } catch (e) {
    return '';
  }
}

(async () => {
  console.log('\nVideo Analyzer – setup');
  console.log('This will create a .env.local file with your API key.');

  if (fs.existsSync(envLocalPath)) {
    console.log('\nA .env.local already exists.');
    const overwrite = (await prompt('Overwrite it? (y/N): ')).trim().toLowerCase();
    if (overwrite !== 'y') {
      console.log('Keeping existing .env.local.');
      process.exit(0);
    }
  }

  const apiKey = (await prompt('\nEnter your Google Gemini API key: ')).trim();
  if (!apiKey) {
    console.error('No API key provided. You can rerun `npm run setup` later.');
    process.exit(1);
  }

  const template = ensureFromExample();
  let output = template || '';

  // If we have an example, replace placeholder. Otherwise, build minimal file.
  if (output.includes('GOOGLE_API_KEY=')) {
    output = output.replace(/GOOGLE_API_KEY=.*\n?/, `GOOGLE_API_KEY=${apiKey}\n`);
  } else {
    output = `GOOGLE_API_KEY=${apiKey}\nRATE_LIMIT_PER_MINUTE=10\nMAX_VIDEO_SIZE_MB=100\n`;
  }

  try {
    fs.writeFileSync(envLocalPath, output, { encoding: 'utf8' });
    console.log(`\nCreated ${envLocalPath}`);
  } catch (e) {
    console.error('Failed to write .env.local:', e.message);
    process.exit(1);
  }

  console.log('\nAll set! Next steps:');
  console.log('  1) npm install');
  console.log('  2) npm run dev');
  console.log('  3) Open http://localhost:3000/video-analyzer');
})();

