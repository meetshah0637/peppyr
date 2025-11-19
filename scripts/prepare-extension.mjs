// Copies extension files into dist/ so it can be loaded as an unpacked Chrome extension.
// Revert: delete this script and remove related npm scripts.
import { cpSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const root = process.cwd()
const distDir = resolve(root, 'dist')

// Ensure dist exists (run after vite build)
mkdirSync(distDir, { recursive: true })

// Copy extension artifacts
cpSync(resolve(root, 'extension', 'manifest.json'), resolve(distDir, 'manifest.json'))
cpSync(resolve(root, 'extension', 'service-worker.js'), resolve(distDir, 'service-worker.js'))
cpSync(resolve(root, 'extension', 'content-script.js'), resolve(distDir, 'content-script.js'))

// Copy icons if present
const iconsSrc = resolve(root, 'extension', 'icons')
if (existsSync(iconsSrc)) {
  cpSync(iconsSrc, resolve(distDir, 'icons'), { recursive: true })
}

console.log('Extension files prepared in dist/. Load dist/ as Unpacked extension.')


