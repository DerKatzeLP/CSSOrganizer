// David Fischer 2023

/*
Dieses Skript sortiert den Style Block ähnliche zu
https://9elements.com/css-rule-order/
aber exakt nach den Vorgaben auf der Grouping JSON Datei
 */

import css from "css"
import { readFileSync } from "fs"
import fsp from "fs/promises"
import path from "path"

const grouping = JSON.parse(readFileSync("./grouping.json"))

const config = JSON.parse(readFileSync("./config.json"))

// Alle CSS Eigenschaften zusammenführen
const allProps = grouping.groups.map((group) => group.properties).flat()

// Sortiert eine Rules Gruppe nach Eigenschaften
function customSort(declar) {
  return declar.sort(
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
    // Lese den aktuellen Inhalt der Vue-Datei
    let htmlContent = await fsp.readFile(filePath, "utf-8")

    // Suche nach dem <style>-Tag
    const styleStart = htmlContent.search("<style.*>")
    if (styleStart === -1) return
    const styleStartString = htmlContent.match("<style.*>")[0]
    const styleStartStringLength = styleStartString.length
    const styleEnd = htmlContent.indexOf("</style>")

    // Überprüfe, ob <style> gefunden wurde
    if (styleStart !== -1 && styleEnd !== -1) {
      // Extrahiere den Inhalt des <style>-Tags
      const styleContent = htmlContent.substring(
        styleStart + styleStartStringLength,
        styleEnd
      )

      // Sortieren des StyleContent
      const sortedStyleContent = "\n" + sortStyleBlock(styleContent) + "\n"

      // Ersetze den aktuellen Inhalt des <style>-Tags mit dem neuen Inhalt
      htmlContent =
        htmlContent.substring(0, styleStart + styleStartStringLength) +
        sortedStyleContent +
        htmlContent.substring(styleEnd)

      // Schreibe den aktualisierten Inhalt zurück in die Datei
      await fsp.writeFile(filePath, htmlContent, "utf-8")

      console.log("--> Datei " + vueFileName + " wurde bearbeitet")
    } else {
      // <style> nicht gefunden
      console.error("Der Inhalt von " + vueFileName + " wurde nicht gefunden.")
    }
  } catch (error) {
    console.error(
      "Fehler beim Aktualisieren der Datei " + vueFileName,
      error.message
    )
  }
}

async function processVueFilesRecursively(folderPath) {
  try {
    // Lies alle Dateinamen im Ordner
    const fileNames = await fsp.readdir(folderPath)

    // Filtere nur Dateien mit der Endung ".vue"
    const vueFiles = fileNames.filter(
      (fileName) => path.extname(fileName) === ".vue"
    )

    // Bearbeite jede Vue-Datei im aktuellen Ordner
    for (const vueFile of vueFiles) {
      const filePath = path.join(folderPath, vueFile)
      await replaceStyleInVueSFC(filePath, vueFile)
    }

    // Durchsuche auch alle Unterordner
    for (const fileName of fileNames) {
      const filePath = path.join(folderPath, fileName)
      const stats = await fsp.stat(filePath)

      if (stats.isDirectory()) {
        // Rekursiv verarbeite Unterordner
        await processVueFilesRecursively(filePath)
      }
    }

    console.log(`====> Ordner ${folderPath} wurde bearbeitet.`)
    console.log(
      `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `
    )
  } catch (error) {
    console.error("Fehler beim Verarbeiten der Vue-Dateien:", error.message)
  }
}

async function processCssFilesRecursively(folderPath) {
  try {
    // Lies alle Dateinamen im Ordner
    const fileNames = await fsp.readdir(folderPath)

    // Filtere nur Dateien mit der Endung ".vue"
    const cssFiles = fileNames.filter(
      (fileName) => path.extname(fileName) === ".css"
    )

    // Bearbeite jede Vue-Datei im aktuellen Ordner
    for (const cssFile of cssFiles) {
      const filePath = path.join(folderPath, cssFile)

      // Lesen der css-Datei
      const styleContent = await fsp.readFile(filePath, "utf-8")

      // Sortieren der Style Blöcke
      const sortedStyleContent = sortStyleBlock(styleContent)

      // Schreibe den aktualisierten Inhalt zurück in die Datei
      await fsp.writeFile(filePath, sortedStyleContent, "utf-8")
    }

    // Durchsuche auch alle Unterordner
    for (const fileName of fileNames) {
      const filePath = path.join(folderPath, fileName)
      const stats = await fsp.stat(filePath)

      if (stats.isDirectory()) {
        // Rekursiv verarbeite Unterordner
        await processCssFilesRecursively(filePath)
      }
    }

    console.log(`====> Ordner ${folderPath} wurde bearbeitet.`)
    console.log(
      `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - `
    )
  } catch (error) {
    console.error("Fehler beim Verarbeiten der CSS-Dateien:", error.message)
  }
}

function runCssOrganizer(config) {
  if (config.sortVueFiles) {
    console.log(
      "---------------------------------------------------------------"
    )
    console.log("START - CSS Organizer - Vue-Files")
    processVueFilesRecursively(config.vueFolderPath)
      .then((r) => console.log("Prozess wurde erfolgreich beendet", r))
      .catch((e) => console.error("Fehler beim Bearbeiten:", e))
      .finally(() => {
        console.log("ENDE - CSS Organizer - Vue-Files")
        console.log(
          "---------------------------------------------------------------"
        )
      })
  }

  if (config.sortCssFiles) {
    console.log(
      "---------------------------------------------------------------"
    )
    console.log("START - CSS Organizer - CSS-Files")
    processCssFilesRecursively(config.cssFolderPath)
      .then((r) => console.log("Prozess wurde erfolgreich beendet", r))
      .catch((e) => console.error("Fehler beim Bearbeiten:", e))
      .finally(() => {
        console.log("ENDE - CSS Organizer - CSS-Files")
        console.log(
          "---------------------------------------------------------------"
        )
      })
  }
}

// Init and start
runCssOrganizer(config)
