# CSSOrganizer

CSSOrganizer is a tool that allows you to configure the sorting of CSS style blocks in both CSS files and Vue Single File Components (SFCs).

## Features

- **Configurable Sorting:** Customize the sorting of CSS style blocks to fit your specific needs.
- **Support for CSS Files and Vue SFCs:** Use CSSOrganizer with traditional CSS files and Vue Single File Components.

## Not supported yet

- **NO Support for SCSS, SASS, LESS Files:** CSSOrganizer is not able to sort `.scss` or `.sass` nor `.less` Files.
- **Grouping comments:** CSSOrganizer is not yet able to add grouping comments to your css or vue files
- **Global install:** There is a known issue with path regarding global installation

## Getting Started

Follow these steps to get started with CSSOrganizer in your project.

### Installation

```bash
npm install @derkatzelp/cssorganizer --save-dev
```

### Usage

```bash
npx css-organizer
```

## Configuration

### Sorting

You can customize the sorting behavior by adjusting the configuration in `sorting.json`. <br>
Each `group` has a `properties` section in which you can add your keys in a specific order.<br>
CSSOrganizer will sort all properties by this given order.

### Options

| Key              | Values  | Default            | Description                                               |
| ---------------- | ------- | ------------------ | --------------------------------------------------------- |
| `cssFolderPath`  | String  | `./src/assets`     | Specifies the path to CSS Files (subfolders included)     |
| `showLogFiles`   | Boolean | `true`             | Enables or disables log report of touched Files           |
| `showLogFolders` | Boolean | `true`             | Enables or disables log report of touched Folders         |
| `sortCssFiles`   | Boolean | `true`             | Enables or disables sorting of CSS Files                  |
| `sortVueFiles`   | Boolean | `true`             | Enables or disables sorting of Vue SFC Files              |
| `vueFolderPath`  | String  | `./src/components` | Specifies the path to Vue SFC Files (subfolders included) |

## Examples

#### Before using CSSOrganizer

```css
.class1 {
  display: block;
  z-index: 1;
  position: fixed;
  border-radius: 6px;
  height: 200px;
  font-size: 14px;
  top: 1rem;
  width: 450px;
  border: 1px solid black;
}

.class2 {
  border: 2px solid red;
  position: relative;
  top: 2rem;
  display: block;
  height: 120px;
  font-size: 12px;
  width: 540px;
  border-radius: 6px;
  z-index: 1;
}
```

#### After using CSSOrganizer

```css
.class1 {
  position: fixed;
  z-index: 1;
  top: 1rem;
  display: block;
  border: 1px solid black;
  border-radius: 6px;
  width: 450px;
  height: 200px;
  font-size: 14px;
}

.class2 {
  position: relative;
  z-index: 1;
  top: 2rem;
  display: block;
  border: 2px solid red;
  border-radius: 6px;
  width: 540px;
  height: 120px;
  font-size: 12px;
}
```

## Dependencies

CSSOrganizer relies on the following external library:

- [adobe/css-tools](https://github.com/adobe/css-tools)
- ~~[css](https://www.npmjs.com/package/css)~~ (before v1.2.0)

## Contributing

If you'd like to contribute to CSSOrganizer, please [contact](https://github.com/DerKatzeLP/CSSOrganizer) me.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

Give credit to any external libraries, tools, or individuals you'd like to acknowledge.

## Idea and inspiration

This package is inspired by the [css-rule-order](https://9elements.com/css-rule-order/)
