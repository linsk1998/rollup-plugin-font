# Build font file by tree-shaking
# 按需打包字体

## Base Config. FontAwesome 4.X Example.

```javascript
import font from "rollup-plugin-font";
export default {
	input: './src/index.tsx',
	output: {
		dir:'./dist',
		format: 'iife'
	},
	plugins: [
		font({
			//svg font use as origin font
			"svg":"./node_modules/font-awesome/fonts/fontawesome-webfont.svg",
			//collect module exports as icon name
			"include": [
				"node_modules/fontawesome/**"
			],
			//if undefined, file name is use rollup config "output.assetFileNames"
			"outDir":"fontawesome",
			//output format
			"output":['svg', 'ttf', 'eot', 'woff', 'woff2'],
			//icon list
			"whiteList":["bell"]
		})
	]
};
```

Usage

```javascript
import * as React from "react";
import * as ReactDOM from "react-dom";
import {book} from "fontawesome-solid";//collect module exports by config "include"

function IconBook(){
	return <i className="fas">{book}</i>;
}
ReactDOM.render(<IconBook></IconBook>,document.body);
```

## Transform Font File And CSS File To ES Module. Ali Iconfont Example.

```javascript
import font from "rollup-plugin-font";
export default {
	input: './src/index.tsx',
	output: {
		dir:'./dist',
		format: 'iife',
		assetFileNames:"assets/[name].[hash][extname]",
	},
	plugins: [
		font({
			"svg":"./src/font/iconfont.svg",
			"unicode":{
				"include":["src/font/iconfont.woff"],
				"prefix":"unicode-"
			},
			"css":{
				"include":["src/font/iconfont.css"],
				"prefix":"icon-",
				"common":"iconfont"
			}
		})
	]
};
```

Usage

```javascript
import * as React from "react";
import * as ReactDOM from "react-dom";
import {unicodeMinimize} from "./font/iconfont.woff";
import {iconfont,iconSearch,iconfont_iconMaximize} from "./font/iconfont.css";

ReactDOM.render(<>
	<i className={iconfont}>{unicodeMinimize}</i>
	<i className={iconfont_iconMaximize}></i>
	<i className={iconfont+" "+iconSearch}></i>
</>,document.body);
```

outcss

```css
.icon-minimize{ ... }
.icon-search{ ... }
...

@font-face {
	font-family: "iconfont";
	...
}
.iconfont{
	font-family: "iconfont" !important;
	...
}
```

## Don't Create Common Css Class. Ionicons 2.X/3.X Example.

```javascript
import font from "rollup-plugin-font";
export default {
	input: './src/index.tsx',
	output: {
		dir:'./dist',
		format: 'iife',
		assetFileNames:"assets/[name].[hash][extname]",
	},
	plugins: [
		font({
			"svg":"./node_modules/ionicons/fonts/ionicons.svg",
			"css":{
				"include":["node_modules/ionicons/css/ionicons.css"]
			},
		})
	]
};
```
Usage

```javascript
import * as React from "react";
import * as ReactDOM from "react-dom";
import {ionEdit,ionEye} from "ionicons/css/ionicons.css";

ReactDOM.render(<>
	<i className={ionEdit}></i>
	<i className={ionEye}></i>
</>,document.body);
```

outcss

```css
.ion-edit{ ... }
.ion-eye{ ... }
...

@font-face {
	font-family: "ionicons";
	...
}
.ion-edit,.ion-eye,...{
	font-family: "ionicons" !important;
	...
}
```

## A Unicode Use Multiple Font And Create Only One Css File. Fontawesome 5.X Example.

```javascript
import font from "rollup-plugin-font";
export default {
	input: './src/index.tsx',
	output: {
		dir:'./dist',
		format: 'iife',
		assetFileNames:"assets/[name].[hash][extname]",
	},
	plugins: [
		font({
			"svg":"./node_modules/@fortawesome/fontawesome-free/webfonts/fa-regular-400.svg",
			"css":{
				"name":"fa5",
				"module":"@fortawesome/fontawesome-free/webfonts/fa-regular-400.css",//this is virtual module
				"common":"far",
				"prefix":"fa-"
			},
			"output":['svg', 'ttf', 'eot', 'woff', 'woff2']//no css output, css output in next plugin
		}),
		font({
			"svg":"./node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.svg",
			"css":{
				"name":"fa5",
				"module":"@fortawesome/fontawesome-free/webfonts/fa-solid-900.css",//this is virtual module
				"common":"fas",
				"prefix":"fa-"
			},
			"output":['svg', 'ttf', 'eot', 'woff', 'woff2','css']//create css
		}),
	]
};
```
Usage

```javascript
import * as React from "react";
import * as ReactDOM from "react-dom";
import {far_faStar,far_faHeart} from "@fortawesome/fontawesome-free/webfonts/fa-regular-400.css";
import {fas,faGlobe,fas_faStar} from "@fortawesome/fontawesome-free/webfonts/fa-solid-900.css";

ReactDOM.render(<>
	<i className={far_faHeart}></i>
	<i className={far_faStar}></i>
	<i className={fas_faStar}></i>
	<i className={fas+" "+faGlobe}></i>
</>,document.body);
```

outcss

```css
.fa-heart{ ... }
.fa-star{ ... } /* Use Multiple Font */
.fa-globe{ ... }
...

@font-face {
	font-family: "fa-regular-400";
	...
}
@font-face {
	font-family: "fa-solid-900";
	...
}
.far{
	font-family: "fa-regular-400" !important;
	...
}
.fas{
	font-family: "fa-solid-900" !important;
	...
}
```

## Other Options

### name

font name. default is svg file name.

### namedExports

icon name to module export name function. default is camelCase.

### namedIcon

module export name to icon name function. default is kebab-case.

### css.compat

* false, don't generate compat css code/file.
* true, create a new compat css.
* undefined(default), generate css code.

## module exports

```javascript
import font from "rollup-plugin-font";
import {getCssFile,getCompatCssFile} from "rollup-plugin-font";
import html from '@rollup/plugin-html';

async function template({ files, publicPath, title }){
	var index=files.js.find(item=>item.name=="index");
	return `\ufeff
<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<link rel="stylesheet" href="${publicPath}${getCssFile("iconfont")}" />
<!--[if lte IE 7]>
<link rel="stylesheet" href="${publicPath}${getCompatCssFile("ionicons")}" />
<![endif]-->
<!--[if gte IE 8]><!-->
<link rel="stylesheet" href="${publicPath}${getCssFile("ionicons")}" />
<!--><![endif]-->
<link rel="stylesheet" href="${publicPath}${getCssFile("fa5")}" />
</head>
<body>
	<script src="${publicPath}${index.fileName}"></script>
</body>
</html>`;
};

export default {
	input: './src/index.tsx',
	output: {
		dir:'./dist',
		format: 'iife',
		assetFileNames:"assets/[name].[hash][extname]",
	},
	plugins: [
		font({
			...
		}),
		...
		html({
			title:"ICON DEMO",
			template:template
		})
	]
};
```