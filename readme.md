# Build font file by tree-shaking 按需打包字体

Usage

```javascript
import {createElement} from "react";
import {render} from "react-dom";
import {book} from "fontawesome-solid";//only use one icon

function IconBook(){
	return <i className="fas">{book}</i>;
}
render(<IconBook></IconBook>,document.body);
```

Config

```javascript
import font from "rollup-plugin-font";
export default {
	input: './src/index.tsx',
	output: {
		file: './dist/modern.js',
		format: 'iife'
	},
	plugins: [
		font({
			"include": [
				"node_modules/fontawesome-solid/**"
			],
			"svg":"./node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.svg",
			"outDir":"./dist/webfonts"
		})
	]
};
```