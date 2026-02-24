#!/usr/bin/env node

import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Convert the URL to a path
const __filename = fileURLToPath(import.meta.url)
// Determine the directory of the current script
const __dirname = dirname(__filename)

// Change the working directory to the location of your package
const packageDirectory = join(__dirname, '..') // Adjust according to where your script is located
process.chdir(packageDirectory)

// Forward CLI arguments (e.g. --root or -r) to the sort script
const args = process.argv.slice(2)
const extraArgs = args.length > 0 ? ' -- ' + args.join(' ') : ''

// Execute the "sort" command from "scripts"
execSync(`npm run sort${extraArgs}`, { stdio: 'inherit' })
