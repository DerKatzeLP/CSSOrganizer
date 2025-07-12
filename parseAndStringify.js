function defineInteropFlag(a) {
  Object.defineProperty(a, "__esModule", { value: true, configurable: true })
}

function exportModule(e, n, v, s) {
  Object.defineProperty(e, n, {
    get: v,
    set: s,
    enumerable: true,
    configurable: true,
  })
}

function trimString(str) {
  return str ? str.trim() : ""
}

function addParentNode(obj, parent) {
  const isNode = obj && typeof obj.type === "string"
  const childParent = isNode ? obj : parent
  for (const k in obj) {
    const value = obj[k]
    if (Array.isArray(value))
      value.forEach((v) => {
        addParentNode(v, childParent)
      })
    else if (value && typeof value === "object")
      addParentNode(value, childParent)
  }
  if (isNode)
    Object.defineProperty(obj, "parent", {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent || null,
    })
  return obj
}

class CssParseError extends Error {
  constructor(filename, msg, lineno, column, css) {
    super(filename + ":" + lineno + ":" + column + ": " + msg)
    this.reason = msg
    this.filename = filename
    this.line = lineno
    this.column = column
    this.source = css
  }
}

class PositionClass {
  constructor(start, end, source) {
    this.start = start
    this.end = end
    this.source = source
  }
}

var CssTypesVar = /*#__PURE__*/ (function (CssTypes) {
  CssTypes["stylesheet"] = "stylesheet"
  CssTypes["rule"] = "rule"
  CssTypes["declaration"] = "declaration"
  CssTypes["comment"] = "comment"
  CssTypes["container"] = "container"
  CssTypes["charset"] = "charset"
  CssTypes["document"] = "document"
  CssTypes["customMedia"] = "custom-media"
  CssTypes["fontFace"] = "font-face"
  CssTypes["host"] = "host"
  CssTypes["import"] = "import"
  CssTypes["keyframes"] = "keyframes"
  CssTypes["keyframe"] = "keyframe"
  CssTypes["layer"] = "layer"
  CssTypes["media"] = "media"
  CssTypes["namespace"] = "namespace"
  CssTypes["page"] = "page"
  CssTypes["startingStyle"] = "starting-style"
  CssTypes["supports"] = "supports"
  return CssTypes
})({})

const commentRegexConst = /\/\*[^]*?(?:\*\/|$)/g

/**
 * Parses CSS text into an AST (Abstract Syntax Tree)
 * @param {string} css - The CSS text to parse
 * @param {object} options - Parser options
 * @returns {object} The CSS AST
 */
const parseCssConstFn = (css, options) => {
  options = options || {}
  let lineno = 1
  let column = 1

  // Track current position in source
  function updatePosition(str) {
    const lines = str.match(/\n/g)
    if (lines) lineno += lines.length
    const i = str.lastIndexOf("\n")
    column = ~i ? str.length - i : column + str.length
  }
  // Create position marker for AST nodes
  function position() {
    const start = {
      line: lineno,
      column: column,
    }
    return function (node) {
      node.position = new (0, PositionClass)(
        start,
        {
          line: lineno,
          column: column,
        },
        options?.source || ""
      )
      whitespace()
      return node
    }
  }
  // Error handling
  const errorsList = []
  function error(msg) {
    const err = new (0, CssParseError)(
      options?.source || "",
      msg,
      lineno,
      column,
      css
    )
    if (options?.silent) errorsList.push(err)
    else throw err
  }

  // Basic CSS parsing utilities
  function open() {
    return match(/^{\s*/)
  }
  function close() {
    return match(/^}/)
  }
  function match(re) {
    const m = re.exec(css)
    if (!m) return
    const str = m[0]
    updatePosition(str)
    css = css.slice(str.length)
    return m
  }
  function whitespace() {
    match(/^\s*/)
  }

  // Parse CSS comments
  function comments(rules) {
    let c
    rules = rules || []
    while ((c = comment())) if (c) rules.push(c)
    return rules
  }

  function comment() {
    const pos = position()
    if ("/" !== css.charAt(0) || "*" !== css.charAt(1)) return
    const m = match(/^\/\*[^]*?\*\//)
    if (!m) return error("End of comment missing")
    return pos({
      type: (0, CssTypesVar).comment,
      comment: m[0].slice(2, -2),
    })
  }

  /**
   * Find the matching closing parenthesis
   * Handles nested parentheses correctly
   */
  function findClosingParenthese(str, start, depth) {
    let ptr = start + 1
    let found = false
    let closeParentheses = str.indexOf(")", ptr)
    while (!found && closeParentheses !== -1) {
      const nextParentheses = str.indexOf("(", ptr)
      if (nextParentheses !== -1 && nextParentheses < closeParentheses) {
        const nextSearch = findClosingParenthese(
          str,
          nextParentheses + 1,
          depth + 1
        )
        ptr = nextSearch + 1
        closeParentheses = str.indexOf(")", ptr)
      } else found = true
    }
    if (found && closeParentheses !== -1) return closeParentheses
    else return -1
  }

  /**
   * Parse CSS selectors
   * Handles complex selectors with parentheses and commas
   */
  function selector() {
    const m = match(/^([^{]+)/)
    if (!m) return
    let res = trimString(m[0]).replace(commentRegexConst, "")
    if (res.indexOf(",") === -1) return [res]
    let ptr = 0
    let startParentheses = res.indexOf("(", ptr)
    while (startParentheses !== -1) {
      const closeParentheses = findClosingParenthese(res, startParentheses, 0)
      if (closeParentheses === -1) break
      ptr = closeParentheses + 1
      res =
        res.substring(0, startParentheses) +
        res
          .substring(startParentheses, closeParentheses)
          .replace(/,/g, "\u200C") +
        res.substring(closeParentheses)
      startParentheses = res.indexOf("(", ptr)
    }
    res = res.replace(/("|')(?:\\\1|.)*?\1/g, (m) => m.replace(/,/g, "\u200C"))
    return res.split(",").map((s) => {
      return trimString(s.replace(/\u200C/g, ","))
    })
  }

  /**
   * Parse CSS declarations (property: value pairs)
   */
  function declaration() {
    const pos = position()
    const propMatch = match(/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/)
    if (!propMatch) return
    const propValue = trimString(propMatch[0])
    if (!match(/^:\s*/)) return error("property missing ':'")
    const val = match(
      /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|[^)])*?\)|[^};])+)/
    )
    const ret = pos({
      type: (0, CssTypesVar).declaration,
      property: propValue.replace(commentRegexConst, ""),
      value: val ? trimString(val[0]).replace(commentRegexConst, "") : "",
    })
    match(/^[;\s]*/)
    return ret
  }

  /**
   * Parse a block of CSS declarations
   */
  function declarations() {
    const decls = []
    if (!open()) return error("missing '{'")
    comments(decls)
    let decl
    while ((decl = declaration() || atapply()))
      if (decl) {
        decls.push(decl)
        comments(decls)
      }
    if (!close()) {
      return error("declarations - missing '}'")
    }
    return decls
  }

  // Parse various at-rules
  function keyframe() {
    let m
    const vals = []
    const pos = position()
    while ((m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/))) {
      vals.push(m[1])
      match(/^,\s*/)
    }
    if (!vals.length) return
    return pos({
      type: (0, CssTypesVar).keyframe,
      values: vals,
      declarations: declarations() || [],
    })
  }
  function atkeyframes() {
    const pos = position()
    const m1 = match(/^@([-\w]+)?keyframes\s*/)
    if (!m1) return
    const vendor = m1[1]
    const m2 = match(/^([-\w]+)\s*/)
    if (!m2) return error("@keyframes missing name")
    const name = m2[1]
    if (!open()) return error("@keyframes missing '{'")
    let frame
    let frames = comments()
    while ((frame = keyframe())) {
      frames.push(frame)
      frames = frames.concat(comments())
    }
    if (!close()) return error("@keyframes missing '}'")
    return pos({
      type: (0, CssTypesVar).keyframes,
      name: name,
      vendor: vendor,
      keyframes: frames,
    })
  }
  function atsupports() {
    const pos = position()
    const m = match(/^@supports *([^{]+)/)
    if (!m) return
    const supports = trimString(m[1])
    if (!open()) return error("@supports missing '{'")
    const style = comments().concat(rules())
    if (!close()) return error("@supports missing '}'")
    return pos({
      type: (0, CssTypesVar).supports,
      supports: supports,
      rules: style,
    })
  }
  function athost() {
    const pos = position()
    const m = match(/^@host\s*/)
    if (!m) return
    if (!open()) return error("@host missing '{'")
    const style = comments().concat(rules())
    if (!close()) return error("@host missing '}'")
    return pos({
      type: (0, CssTypesVar).host,
      rules: style,
    })
  }
  function atcontainer() {
    const pos = position()
    const m = match(/^@container *([^{]+)/)
    if (!m) return
    const container = trimString(m[1])
    if (!open()) return error("@container missing '{'")
    const style = comments().concat(rules())
    if (!close()) return error("@container missing '}'")
    return pos({
      type: (0, CssTypesVar).container,
      container: container,
      rules: style,
    })
  }
  function atlayer() {
    const pos = position()
    const m = match(/^@layer *([^{;@]+)/)
    if (!m) return
    const layer = trimString(m[1])
    if (!open()) {
      match(/^[;\s]*/)
      return pos({
        type: (0, CssTypesVar).layer,
        layer: layer,
      })
    }
    const style = comments().concat(rules())
    if (!close()) return error("@layer missing '}'")
    return pos({
      type: (0, CssTypesVar).layer,
      layer: layer,
      rules: style,
    })
  }
  function atmedia() {
    const pos = position()
    const m = match(/^@media *([^{]+)/)
    if (!m) return
    const media = trimString(m[1])
    if (!open()) return error("@media missing '{'")
    const style = comments().concat(rules())
    if (!close()) return error("@media missing '}'")
    return pos({
      type: (0, CssTypesVar).media,
      media: media,
      rules: style,
    })
  }
  function atcustommedia() {
    const pos = position()
    const m = match(/^@custom-media\s+(--\S+)\s*([^{;\s][^{;]*);/)
    if (!m) return
    return pos({
      type: (0, CssTypesVar).customMedia,
      name: trimString(m[1]),
      media: trimString(m[2]),
    })
  }
  function atpage() {
    const pos = position()
    const m = match(/^@page */)
    if (!m) return
    const sel = selector() || []
    if (!open()) return error("@page missing '{'")
    let decls = comments()
    let decl
    while ((decl = declaration())) {
      decls.push(decl)
      decls = decls.concat(comments())
    }
    if (!close()) return error("@page missing '}'")
    return pos({
      type: (0, CssTypesVar).page,
      selectors: sel,
      declarations: decls,
    })
  }
  function atdocument() {
    const pos = position()
    const m = match(/^@([-\w]+)?document *([^{]+)/)
    if (!m) return
    const vendor = trimString(m[1])
    const doc = trimString(m[2])
    if (!open()) return error("@document missing '{'")
    const style = comments().concat(rules())
    if (!close()) return error("@document missing '}'")
    return pos({
      type: (0, CssTypesVar).document,
      document: doc,
      vendor: vendor,
      rules: style,
    })
  }
  function atfontface() {
    const pos = position()
    const m = match(/^@font-face\s*/)
    if (!m) return
    if (!open()) return error("@font-face missing '{'")
    let decls = comments()
    let decl
    while ((decl = declaration())) {
      decls.push(decl)
      decls = decls.concat(comments())
    }
    if (!close()) return error("@font-face missing '}'")
    return pos({
      type: (0, CssTypesVar).fontFace,
      declarations: decls,
    })
  }
  function atstartingstyle() {
    const pos = position()
    const m = match(/^@starting-style\s*/)
    if (!m) return
    if (!open()) return error("@starting-style missing '{'")
    const style = comments().concat(rules())
    if (!close()) return error("@starting-style missing '}'")
    return pos({
      type: (0, CssTypesVar).startingStyle,
      rules: style,
    })
  }

  /**
   * Generic at-rule compiler
   */
  function _compileAtrule(name) {
    const re = new RegExp(
      "^@" +
        name +
        "\\s*((?::?[^;'\"]|\"(?:\\\\\"|[^\"])*?\"|'(?:\\\\'|[^'])*?')+)(?:;|$)"
    )
    return function () {
      const pos = position()
      const m = match(re)
      if (!m) return
      const ret = {
        type: name,
      }
      ret[name] = m[1].trim()
      return pos(ret)
    }
  }

  // Compile specific at-rules
  const atimport = _compileAtrule("import")
  const atcharset = _compileAtrule("charset")
  const atnamespace = _compileAtrule("namespace")

  /**
   * Parse any at-rule
   */
  function atrule() {
    if (css[0] !== "@") return
    return (
      atkeyframes() ||
      atmedia() ||
      atcustommedia() ||
      atsupports() ||
      atimport() ||
      atcharset() ||
      atnamespace() ||
      atdocument() ||
      atpage() ||
      athost() ||
      atfontface() ||
      atcontainer() ||
      atstartingstyle() ||
      atlayer()
    )
  }

  /**
   * Parse @apply rule
   */
  function atapply() {
    const pos = position()
    const m = match(/^@apply\s+([^;]+);/)
    if (!m) return
    const t_ret = pos({
      type: "apply",
      apply: m[1].trim(),
    })
    return t_ret
  }

  /**
   * Parse a CSS rule (selectors + declarations)
   */
  function rule() {
    const pos = position()
    const sel = selector()
    if (!sel) return error("selector missing")
    comments()
    return pos({
      type: (0, CssTypesVar).rule,
      selectors: sel,
      declarations: declarations() || [],
    })
  }

  /**
   * Parse multiple CSS rules
   */
  function rules() {
    let node
    const rules = []
    whitespace()
    comments(rules)
    while (css.length && css.charAt(0) !== "}" && (node = atrule() || rule()))
      if (node) {
        rules.push(node)
        comments(rules)
      }
    return rules
  }

  /**
   * Parse complete CSS stylesheet
   */
  function stylesheet() {
    const rulesList = rules()
    const result = {
      type: (0, CssTypesVar).stylesheet,
      stylesheet: {
        source: options?.source,
        rules: rulesList,
        parsingErrors: errorsList,
      },
    }
    return result
  }
  return addParentNode(stylesheet())
}

var parseCssVar = parseCssConstFn

/**
 * CSS Compiler class
 * Converts CSS AST back to CSS text
 */
class CssCompilerClass {
  constructor(options) {
    this.level = 0
    this.indentation = "  "
    this.compress = false
    if (typeof options?.indent === "string") this.indentation = options?.indent
    if (options?.compress) this.compress = true
  }
  emit(str, _position) {
    return str
  }
  indent(level) {
    this.level = this.level || 1
    if (level) {
      this.level += level
      return ""
    }
    return Array(this.level).join(this.indentation)
  }
  visit(node) {
    switch (node.type) {
      case (0, CssTypesVar).stylesheet:
        return this.stylesheet(node)
      case (0, CssTypesVar).rule:
        return this.rule(node)
      case (0, CssTypesVar).declaration:
        return this.declaration(node)
      case (0, CssTypesVar).comment:
        return this.comment(node)
      case (0, CssTypesVar).container:
        return this.container(node)
      case (0, CssTypesVar).charset:
        return this.charset(node)
      case (0, CssTypesVar).document:
        return this.document(node)
      case (0, CssTypesVar).customMedia:
        return this.customMedia(node)
      case (0, CssTypesVar).fontFace:
        return this.fontFace(node)
      case (0, CssTypesVar).host:
        return this.host(node)
      case (0, CssTypesVar).import:
        return this.import(node)
      case (0, CssTypesVar).keyframes:
        return this.keyframes(node)
      case (0, CssTypesVar).keyframe:
        return this.keyframe(node)
      case (0, CssTypesVar).layer:
        return this.layer(node)
      case (0, CssTypesVar).media:
        return this.media(node)
      case (0, CssTypesVar).namespace:
        return this.namespace(node)
      case (0, CssTypesVar).page:
        return this.page(node)
      case (0, CssTypesVar).startingStyle:
        return this.startingStyle(node)
      case (0, CssTypesVar).supports:
        return this.supports(node)
      case "apply":
        return this.apply(node)
    }
  }
  apply(node) {
    return this.emit("@apply " + node.apply + ";", node.position)
  }
  mapVisit(nodes, delim) {
    let buf = ""
    delim = delim || ""
    for (let i = 0, length = nodes.length; i < length; i++) {
      buf += this.visit(nodes[i])
      if (delim && i < length - 1) buf += this.emit(delim)
    }
    return buf
  }
  compile(node) {
    if (this.compress)
      return node.stylesheet.rules.map(this.visit, this).join("")
    return this.stylesheet(node)
  }
  stylesheet(node) {
    return this.mapVisit(node.stylesheet.rules, "\n\n")
  }
  comment(node) {
    if (this.compress) return this.emit("", node.position)
    return this.emit(this.indent() + "/*" + node.comment + "*/", node.position)
  }
  container(node) {
    if (this.compress)
      return (
        this.emit("@container " + node.container, node.position) +
        this.emit("{") +
        this.mapVisit(node.rules) +
        this.emit("}")
      )
    return (
      this.emit(this.indent() + "@container " + node.container, node.position) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit("\n" + this.indent(-1) + this.indent() + "}")
    )
  }
  layer(node) {
    if (this.compress)
      return (
        this.emit("@layer " + node.layer, node.position) +
        (node.rules
          ? this.emit("{") + this.mapVisit(node.rules) + this.emit("}")
          : ";")
      )
    return (
      this.emit(this.indent() + "@layer " + node.layer, node.position) +
      (node.rules
        ? this.emit(" {\n" + this.indent(1)) +
          this.mapVisit(node.rules, "\n\n") +
          this.emit("\n" + this.indent(-1) + this.indent() + "}")
        : ";")
    )
  }
  import(node) {
    return this.emit("@import " + node.import + ";", node.position)
  }
  media(node) {
    if (this.compress)
      return (
        this.emit("@media " + node.media, node.position) +
        this.emit("{") +
        this.mapVisit(node.rules) +
        this.emit("}")
      )
    return (
      this.emit(this.indent() + "@media " + node.media, node.position) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit("\n" + this.indent(-1) + this.indent() + "}")
    )
  }
  document(node) {
    const doc = "@" + (node.vendor || "") + "document " + node.document
    if (this.compress)
      return (
        this.emit(doc, node.position) +
        this.emit("{") +
        this.mapVisit(node.rules) +
        this.emit("}")
      )
    return (
      this.emit(doc, node.position) +
      this.emit("  {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit(this.indent(-1) + "\n}")
    )
  }
  charset(node) {
    return this.emit("@charset " + node.charset + ";", node.position)
  }
  namespace(node) {
    return this.emit("@namespace " + node.namespace + ";", node.position)
  }
  startingStyle(node) {
    if (this.compress)
      return (
        this.emit("@starting-style", node.position) +
        this.emit("{") +
        this.mapVisit(node.rules) +
        this.emit("}")
      )
    return (
      this.emit(this.indent() + "@starting-style", node.position) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit("\n" + this.indent(-1) + this.indent() + "}")
    )
  }
  supports(node) {
    if (this.compress)
      return (
        this.emit("@supports " + node.supports, node.position) +
        this.emit("{") +
        this.mapVisit(node.rules) +
        this.emit("}")
      )
    return (
      this.emit(this.indent() + "@supports " + node.supports, node.position) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit("\n" + this.indent(-1) + this.indent() + "}")
    )
  }
  keyframes(node) {
    if (this.compress)
      return (
        this.emit(
          "@" + (node.vendor || "") + "keyframes " + node.name,
          node.position
        ) +
        this.emit("{") +
        this.mapVisit(node.keyframes) +
        this.emit("}")
      )
    return (
      this.emit(
        "@" + (node.vendor || "") + "keyframes " + node.name,
        node.position
      ) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.keyframes, "\n") +
      this.emit(this.indent(-1) + "}")
    )
  }
  keyframe(node) {
    const decls = node.declarations
    if (this.compress)
      return (
        this.emit(node.values.join(","), node.position) +
        this.emit("{") +
        this.mapVisit(decls) +
        this.emit("}")
      )
    return (
      this.emit(this.indent()) +
      this.emit(node.values.join(", "), node.position) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(decls, "\n") +
      this.emit(this.indent(-1) + "\n" + this.indent() + "}\n")
    )
  }
  page(node) {
    if (this.compress) {
      const sel = node.selectors.length ? node.selectors.join(", ") : ""
      return (
        this.emit("@page " + sel, node.position) +
        this.emit("{") +
        this.mapVisit(node.declarations) +
        this.emit("}")
      )
    }
    const sel = node.selectors.length ? node.selectors.join(", ") + " " : ""
    return (
      this.emit("@page " + sel, node.position) +
      this.emit("{\n") +
      this.emit(this.indent(1)) +
      this.mapVisit(node.declarations, "\n") +
      this.emit(this.indent(-1)) +
      this.emit("\n}")
    )
  }
  fontFace(node) {
    if (this.compress)
      return (
        this.emit("@font-face", node.position) +
        this.emit("{") +
        this.mapVisit(node.declarations) +
        this.emit("}")
      )
    return (
      this.emit("@font-face ", node.position) +
      this.emit("{\n") +
      this.emit(this.indent(1)) +
      this.mapVisit(node.declarations, "\n") +
      this.emit(this.indent(-1)) +
      this.emit("\n}")
    )
  }
  host(node) {
    if (this.compress)
      return (
        this.emit("@host", node.position) +
        this.emit("{") +
        this.mapVisit(node.rules) +
        this.emit("}")
      )
    return (
      this.emit("@host", node.position) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit(this.indent(-1) + "\n}")
    )
  }
  customMedia(node) {
    return this.emit(
      "@custom-media " + node.name + " " + node.media + ";",
      node.position
    )
  }
  rule(node) {
    const decls = node.declarations
    if (!decls.length) return ""
    if (this.compress)
      return (
        this.emit(node.selectors.join(","), node.position) +
        this.emit("{") +
        this.mapVisit(decls) +
        this.emit("}")
      )
    const indent = this.indent()
    return (
      this.emit(
        node.selectors
          .map((s) => {
            return indent + s
          })
          .join(",\n"),
        node.position
      ) +
      this.emit(" {\n") +
      this.emit(this.indent(1)) +
      this.mapVisit(decls, "\n") +
      this.emit(this.indent(-1)) +
      this.emit("\n" + this.indent() + "}")
    )
  }
  declaration(node) {
    if (this.compress)
      return (
        this.emit(node.property + ":" + node.value, node.position) +
        this.emit(";")
      )
    return (
      this.emit(this.indent()) +
      this.emit(node.property + ": " + node.value, node.position) +
      this.emit(";")
    )
  }
}

var CssCompilerVar = CssCompilerClass

var compileCssVar = (node, options) => {
  const compiler = new (0, CssCompilerVar)(options || {})
  return compiler.compile(node)
}

const parseCssGlobal = (0, parseCssVar)
const stringifyCssGlobal = (0, compileCssVar)
var cssParserGlobal = {
  parse: parseCssGlobal,
  stringify: stringifyCssGlobal,
}

/**
 * Main exports
 */
export {
  parseCssGlobal as parse,
  stringifyCssGlobal as stringify,
  cssParserGlobal as default,
  CssTypesVar as CssTypes,
}
