#!/usr/bin/env node

import { execSync } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// Convert the URL to a path
const __filename = fileURLToPath(import.meta.url)
// Determine the directory of the current script
const __dirname = dirname(__filename)

// Change the working directory to the location of your package
const packageDirectory = join(__dirname, "..") // Adjust according to where your script is located
process.chdir(packageDirectory)

// Execute the "sort" command from "scripts"
execSync("npm run sort", { stdio: "inherit" })
