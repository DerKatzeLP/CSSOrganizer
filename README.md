# CSSOrganizer

CSSOrganizer is a tool that allows you to configure the sorting of CSS style blocks in both CSS files and Vue Single File Components (SFCs).

## Features

- **Configurable Sorting:** Customize the sorting of CSS style blocks to fit your specific needs.
- **Support for CSS Files and Vue SFCs:** Use CSSOrganizer with traditional CSS files and Vue Single File Components.

## Not supported yet

- **NO Support for SCSS, SASS, LESS Files:** CSSOrganizer is not able to sort `.scss` or `.sass` nor `.less` Files.
- **Grouping comments:** CSSOrganizer is not yet able to add grouping comments to your css or vue files

## Getting Started

Follow these steps to get started with CSSOrganizer in your project.

### Installation

```bash
npm install css-organizer --save-dev
```

### Usage

```bash
npm run sort
```
## Configuration

### Sorting

You can customize the sorting behavior by adjusting the configuration in `sorting.json`. <br>
Each `group` has a `properties` section in which you can add your keys in a specific order.<br>
CSSOrganizer will sort all properties by this given order.

### Options

| Key             | Values  | Default           | Description                                               |
| --------------- | ------- | ----------------- | --------------------------------------------------------- |
| `sortVueFiles`  | Boolean | `true`            | Enables or disables sorting of Vue SFC Files              |
| `sortCssFiles`  | Boolean | `true`            | Enables or disables sorting of CSS Files                  |
| `vueFolderPath` | String  | `./src/components`| Specifies the path to Vue SFC Files (subfolders included) |
| `cssFolderPath` | String  | `./src/assets`    | Specifies the path to CSS Files (subfolders included)     |


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

- [css](https://www.npmjs.com/package/css)


## Contributing

If you'd like to contribute to CSSOrganizer, please [contact](https://github.com/DerKatzeLP/CSSOrganizer) me.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

Give credit to any external libraries, tools, or individuals you'd like to acknowledge.