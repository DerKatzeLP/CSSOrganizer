import { log } from "console"
import css from "@adobe/css-tools"
import { readFileSync } from "fs"
import fsp from "fs/promises"
import path, { join } from "path"

// Sorts a rules group based on properties
function customSort(declarations) {
  return declarations.sort(
    (a, b) => allProps.indexOf(a.property) - allProps.indexOf(b.property)
  )
}

function sortStyleBlock(styleContent) {
  const parsed = css.parse(styleContent)

  parsed.stylesheet.rules.forEach((rule) => {
    if (rule?.declarations) rule.declarations = customSort(rule.declarations)
  })

  return css.stringify(parsed)
}

async function replaceStyleInVueSFC(filePath, vueFileName = "xyz.vue") {
  try {
    // Read the current content of the Vue file
    let htmlContent = await fsp.readFile(filePath, "utf-8")

    // Search for the <style> tag
    const styleStart = htmlContent.search("<style.*>")
    if (styleStart === -1) return
    const styleStartString = htmlContent.match("<style.*>")[0]
    const styleStartStringLength = styleStartString.length
    const styleEnd = htmlContent.indexOf("</style>")

    // Check if <style> was found
    if (styleStart !== -1 && styleEnd !== -1) {
      // Extract the content of the <style> tag
      const styleContent = htmlContent.substring(
        styleStart + styleStartStringLength,
        styleEnd
      )

      // Sort the style content
      const sortedStyleContent = "\n" + sortStyleBlock(styleContent) + "\n"

      // Replace the current content of the <style> tag with the new content
      htmlContent =
        htmlContent.substring(0, styleStart + styleStartStringLength) +
        sortedStyleContent +
        htmlContent.substring(styleEnd)

      // Write the updated content back to the file
      await fsp.writeFile(filePath, htmlContent, "utf-8")

      if (config.showLogFiles)
        console.log(
          "--> File \x1b[33m" + vueFileName + "\x1b[0m has been edited"
        )
    } else {
      // <style> not found
      console.error(
        "\x1b[31mThe content of " + vueFileName + " was not found.\x1b[0m"
      )
    }
  } catch (error) {
    console.error("Error updating the file " + vueFileName, error.message)
  }
}

async function processVueFilesRecursively(folderPath) {
  try {
    // Read all filenames in the folder
    const fileNames = await fsp.readdir(folderPath)

    // Filter only files with the extension ".vue"
    const vueFiles = fileNames.filter(
      (fileName) => path.extname(fileName) === ".vue"
    )

    // Process each Vue file in the current folder
    for (const vueFile of vueFiles) {
      const filePath = path.join(folderPath, vueFile)
      await replaceStyleInVueSFC(filePath, vueFile)
    }

    // Also search through all subfolders
    for (const fileName of fileNames) {
      const filePath = path.join(folderPath, fileName)
      const stats = await fsp.stat(filePath)

      if (stats.isDirectory()) {
        // Recursively process subfolders
        await processVueFilesRecursively(filePath)
      }
    }
    if (config.showLogFolders) {
      console.log(
        `====> Folder \x1b[33m${folderPath}\x1b[0m has been processed.`
      )
      console.log(
        `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `
      )
    }
  } catch (error) {
    console.error("\x1b[31mError processing Vue files:\x1b[0m", error.message)
  }
}

async function processCssFilesRecursively(folderPath) {
  try {
    // Read all filenames in the folder
    const fileNames = await fsp.readdir(folderPath)

    // Filter only files with the extension ".css"
    const cssFiles = fileNames.filter(
      (fileName) => path.extname(fileName) === ".css"
    )

    // Process each CSS file in the current folder
    for (const cssFile of cssFiles) {
      const filePath = path.join(folderPath, cssFile)

      // Read the CSS file
      const styleContent = await fsp.readFile(filePath, "utf-8")

      // Sort the style blocks
      const sortedStyleContent = sortStyleBlock(styleContent)

      // Write the updated content back to the file
      await fsp.writeFile(filePath, sortedStyleContent, "utf-8")

      if (config.showLogFiles)
        console.log("--> File \x1b[33m" + cssFile + "\x1b[0m has been edited")
    }

    // Also search through all subfolders
    for (const fileName of fileNames) {
      const filePath = path.join(folderPath, fileName)
      const stats = await fsp.stat(filePath)

      if (stats.isDirectory()) {
        // Recursively process subfolders
        await processCssFilesRecursively(filePath)
      }
    }

    if (config.showLogFolders) {
      console.log(
        `====> Folder \x1b[33m${folderPath}\x1b[0m has been processed.`
      )
      console.log(
        `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `
      )
    }
  } catch (error) {
    console.error("\x1b[31mError processing CSS files:\x1b[0m", error.message)
  }
}

function organizeVuePart(config, projectRoot) {
  console.log("---------------------------------------------------------------")
  console.log("CSSOrganizer - START - Vue Files")

  // Construct the absolute path
  const vueAbsolutePath = join(projectRoot, config.vueFolderPath)

  processVueFilesRecursively(vueAbsolutePath)
    .then(() =>
      console.log("\x1b[32mVue Process completed successfully\x1b[0m")
    )
    .catch((error) =>
      console.error("\x1b[31mError processing Vue:\x1b[0m", error)
    )
    .finally(() => {
      console.log("CSSOrganizer - END - Vue Files")
      console.log(
        "---------------------------------------------------------------"
      )
      if (config.sortCssFiles) {
        organizeCssPart(config, projectRoot)
      }
    })
}

function organizeCssPart(config, projectRoot) {
  console.log("---------------------------------------------------------------")
  console.log("CSSOrganizer - START - CSS Files")

  // Construct the absolute path
  const cssAbsolutePath = join(projectRoot, config.cssFolderPath)

  processCssFilesRecursively(cssAbsolutePath)
    .then(() =>
      console.log("\x1b[32mCSS Process completed successfully\x1b[0m")
    )
    .catch((error) =>
      console.error("\x1b[31mError processing CSS:\x1b[0m", error)
    )
    .finally(() => {
      console.log("CSSOrganizer - END - CSS Files")
      console.log(
        "---------------------------------------------------------------"
      )
    })
}

function runCssOrganizer(config, projectRoot) {
  console.log("\x1b[33mPath to project root\x1b[0m", projectRoot)

  if (config.sortVueFiles) {
    organizeVuePart(config, projectRoot)
  } else if (config.sortCssFiles) {
    organizeCssPart(config, projectRoot)
  }
}

// Navigate to the root directory of the project
const projectRoot = process.cwd().split("node_modules")[0]
if (projectRoot.endsWith("/")) {
  projectRoot = projectRoot.slice(0, -1)
}

// Get grouping settings
let grouping = null
try {
  grouping = JSON.parse(readFileSync(projectRoot + "grouping.cssorg.json"))
} catch {
  try {
    grouping = JSON.parse(readFileSync("./grouping.json"))
  } catch {
    console.log(
      "\x1b[47m\x1b[31m# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #"
    )
    console.error(
      "# Could not load grouping file.                             #"
    )
    console.error(
      "# Please add a valid grouping.cssorg.json                   #"
    )
    console.log("# Add the file to your root folder: ./grouping.cssorg.json  #")
    console.log(
      "# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #\x1b[0m"
    )
    process.exit(0)
  }
}

// Get config
let config = null
try {
  config = JSON.parse(readFileSync(projectRoot + "config.cssorg.json"))
} catch {
  try {
    config = JSON.parse(readFileSync("./config.json"))
  } catch {
    console.log(
      "\x1b[47m\x1b[31m# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #"
    )
    console.error("# Could not load config file.                             #")
    console.error("# Please add a valid config.cssorg.json                   #")
    console.log("# Add the file to your root folder: ./config.cssorg.json  #")
    console.log(
      "# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #\x1b[0m"
    )
    process.exit(0)
  }
}

// Merge all CSS properties
const allProps = grouping.groups.map((group) => group.properties).flat()

// Init and start
runCssOrganizer(config, projectRoot)
