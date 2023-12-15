import css from "css"
import { readFileSync } from "fs"
import fsp from "fs/promises"
import path, { join } from "path"

const grouping = JSON.parse(readFileSync("./grouping.json"))

const config = JSON.parse(readFileSync("./config.json"))

// Merge all CSS properties
const allProps = grouping.groups.map((group) => group.properties).flat()

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

      console.log("--> File " + vueFileName + " has been edited")
    } else {
      // <style> not found
      console.error("The content of " + vueFileName + " was not found.")
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

    console.log(`====> Folder ${folderPath} has been processed.`)
    console.log(
      `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `
    )
  } catch (error) {
    console.error("Error processing Vue files:", error.message)
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

    console.log(`====> Folder ${folderPath} has been processed.`)
    console.log(
      `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `
    )
  } catch (error) {
    console.error("Error processing CSS files:", error.message)
  }
}

function runCssOrganizer(config) {
  // Navigate to the root directory of the project
  const projectRoot = process.cwd().split("node_modules")[0].slice(0, -1)
  console.log("Path to project root", projectRoot)

  if (config.sortVueFiles) {
    console.log(
      "---------------------------------------------------------------"
    )
    console.log("START - CSSOrganizer - Vue Files")

    // Construct the absolute path
    const vueAbsolutePath = join(projectRoot, config.vueFolderPath)

    processVueFilesRecursively(vueAbsolutePath)
      .then(() => console.log("Process completed successfully"))
      .catch((error) => console.error("Error processing:", error))
      .finally(() => {
        console.log("END - CSSOrganizer - Vue Files")
        console.log(
          "---------------------------------------------------------------"
        )
      })
  }

  if (config.sortCssFiles) {
    console.log(
      "---------------------------------------------------------------"
    )
    console.log("START - CSSOrganizer - CSS Files")

    // Construct the absolute path
    const cssAbsolutePath = join(projectRoot, config.cssFolderPath)

    processCssFilesRecursively(cssAbsolutePath)
      .then(() => console.log("Process completed successfully"))
      .catch((error) => console.error("Error processing:", error))
      .finally(() => {
        console.log("END - CSSOrganizer - CSS Files")
        console.log(
          "---------------------------------------------------------------"
        )
      })
  }
}

// Init and start
runCssOrganizer(config)
