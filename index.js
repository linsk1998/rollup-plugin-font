
var { createFilter } = require('rollup-pluginutils');
var { readFileSync } = require('fs');
var { resolve, basename } = require('path');
var convert = require('xml-js');
var filesize = require("filesize");
var svg2ttf = require('svg2ttf');
var ttf2woff2 = require('ttf2woff2');
var ttf2woff = require('ttf2woff');
var ttf2eot = require('ttf2eot');
var camelCase = require('camelCase');
var kebabCase = require('kebab-case');

var cssFileNameMap = new Map();
var cssCompatFileNameMap = new Map();
var cssMap = new Map();
var cssCompatMap = new Map();

const PREFIX = `\font:`;

function font(options = {}) {
	const filter = (options.include || options.exclude) ? createFilter(options.include, options.exclude) : null;
	if (!options.svg) {
		throw new Error("options.svg is undefined");
	}
	if (!options.name) {
		options.name = basename(options.svg, '.svg');
	}
	if (!options.output) {
		options.output = ['svg', 'ttf', 'eot', 'woff', 'woff2', 'css'];
	}
	if (!options.prefix) {
		options.prefix = "";
	}
	if (!options.namedExports) {
		options.namedExports = camelCase;
	}
	if (!options.namedIcon) {
		options.namedIcon = kebabCase;
	}
	var css = options.css;
	if (css) {
		if (!css.name) {
			css.name = options.name;
		}
		if (!css.compat) {
			css.compat = false;
		}
		if (!css.prefix) {
			css.prefix = options.prefix;
		}
		if (!css.namedExports) {
			css.namedExports = options.namedExports;
		}
		if (!css.namedIcon) {
			css.namedIcon = options.namedIcon;
		}
		if (css.common) {
			if (typeof css.common === "string") {
				css.common = {
					name: css.common
				};
			}
			if (!css.common.namedExports) {
				css.common.namedExports = css.namedExports;
			}
			if (!css.common.namedIcon) {
				css.common.namedIcon = css.namedIcon;
			}
		}
	}
	var unicode = options.unicode;
	if (unicode) {
		if (!unicode.prefix) {
			unicode.prefix = options.prefix;
		}
		if (!unicode.namedExports) {
			unicode.namedExports = options.namedExports;
		}
		if (!unicode.namedIcon) {
			unicode.namedIcon = options.namedIcon;
		}
	}
	var xml = readFileSync(resolve("./", options.svg));
	var json = convert.xml2js(xml, { alwaysChildren: true });
	var font = find(find(find(json, "svg"), "defs"), "font");
	var fontId = font.attributes.id;
	var unicodeMap = new Map();
	font.elements.forEach(function(ele) {
		if (ele.type === 'element' && ele.name === 'glyph') {
			unicodeMap.set(ele.attributes['glyph-name'], ele.attributes['unicode']);
		}
	});
	return {
		name: 'rollup-plugin-font',
		resolveId(id, importer) {
			if (css) {
				if (id == css.module) {
					return PREFIX + id;
				}
			}
			if (unicode) {
				if (id == unicode.module) {
					return PREFIX + id;
				}
			}

			return null;
		},
		load(id) {
			//console.log(id);
			if (css) {
				if (id == PREFIX + css.module) {
					var cssModule = [];
					unicodeMap.forEach(function(code, name) {
						cssModule.push("export var " + css.namedExports(css.prefix + name) + '="' + css.prefix + name + '";');
						if (css.common) {
							cssModule.push("export var " + css.common.name+"_"+css.common.namedExports(css.prefix+name) + '="' + css.common.name + " " + css.prefix + name + '";');
						}
					});
					if (css.common) {
						cssModule.push("export var " + css.namedExports(css.common.name) + '="' + css.common.name + '";');
					}
					return cssModule.join("\n");
				}
			}
			if (unicode) {
				if (id == PREFIX + unicode.module) {
					var unicodeModule = [];
					unicodeMap.forEach(function(code, name) {
						unicodeModule.push("export var " + unicode.namedExports(unicode.prefix + name) + '="' + code + '";');
					});
					return unicodeModule.join("\n");
				}
			}
		},
		transform(code, id) {
			//console.log("transform",id);
			if (css && css.include) {
				const cssFilter = createFilter(css.include);
				if (cssFilter(id)) {
					var cssModule = [];
					unicodeMap.forEach(function(code, name) {
						cssModule.push("export var " + css.namedExports(css.prefix+name) + '="' + css.prefix + name + '";');
						if (css.common) {
							cssModule.push("export var " + css.common.name+"_"+css.common.namedExports(css.prefix+name) + '="' + css.common.name + " " + css.prefix + name + '";');
						}
					});
					if (css.common) {
						cssModule.push("export var " + css.namedExports(css.common.name) + '="' + css.common.name + '";');
					}
					return cssModule.join("\n");
				}
			}
			if (unicode && unicode.include) {
				const unicodeFilter = createFilter(unicode.include);
				if (unicodeFilter(id)) {
					var unicodeModule = [];
					unicodeMap.forEach(function(code, name) {
						unicodeModule.push("export var " + unicode.namedExports(unicode.prefix + name) + '="' + code + '";');
					});
					return unicodeModule.join("\n");
				}
			}
		},
		generateBundle(options_, bundle) {
			//console.log(options_);
			//console.log(bundle);
			var exps = new Set(options.whiteList);
			for (var chunkId of Object.keys(bundle)) {
				var chunk = bundle[chunkId];
				var importedBindings;
				if (chunk.importedBindings) {
					importedBindings = Object.assign(Object.create(null), chunk.importedBindings);
				}
				var modules = chunk.modules;
				if (modules) {
					for (let moduleId of Object.keys(modules)) {
						var module = modules[moduleId];
						importedBindings[moduleId] = module.renderedExports;
					}
				}
				if (importedBindings) {
					for (let moduleId of Object.keys(importedBindings)) {
						var exports = importedBindings[moduleId];
						//console.log("moduleId",moduleId);
						if (filter && filter(moduleId)) {
							exports.forEach(function(name) {
								name = options.namedIcon(name);
								exps.add(name);
							});
						}
						if(unicode){
							if (moduleId == PREFIX + unicode.module || unicode.include && createFilter(unicode.include)(moduleId)) {
								exports.forEach(function(name) {
									name = unicode.namedIcon(name);
									if (unicode.prefix) {
										if (name.startsWith(unicode.prefix)) {
											name = name.substr(unicode.prefix.length);
											if (name) {
												exps.add(name);
											}
										}
									} else {
										exps.add(name);
									}
								});
							}
						}
						if(css){
							if (moduleId == PREFIX + css.module || css.include && createFilter(css.include)(moduleId)) {
								exports.forEach(function(name) {
									if (css.common) {
										if (name.startsWith(css.common.name + "_")) {
											name = name.substr(css.common.name.length + 1);
										}
									}
									name = css.namedIcon(name);
									if (css.prefix) {
										if (name.startsWith(css.prefix)) {
											name = name.substr(css.prefix.length);
											if (name) {
												exps.add(name);
												return;
											}
										}
									} else {
										exps.add(name);
									}
								});
							}
						}
					}
				}
			}
			console.log(fontId, "found " + exps.size + " icons", Array.from(exps.keys()));
			if (exps.size === 0) return;
			//console.log("before svg file has "+font.elements.length+" icons");
			var count = 0;
			font.elements = font.elements.filter(function(ele) {
				if (ele.type === 'element') {
					if (ele.name === 'glyph') {
						var name = ele.attributes['glyph-name'];
						if (exps.has(name)) {
							count++;
							return true;
						}
						return false;
					} else if (ele.name === "font-face") {
						if (ele.attributes['font-family'] !== fontId) {
							ele.attributes['font-family'] = fontId;
						}
					}
				}
				return true;
			});
			if (count === 0) {
				console.log("no font found in " + options.name);
				return;
			}
			var refs = {};
			var result = convert.json2xml(json);
			if (options.output.includes("svg")) {
				console.log(options.name + ".svg - " + filesize(result.length));
				refs.svg = this.emitFile({
					type: 'asset',
					name: options.name + '.svg',
					fileName: options.outDir ? options.outDir + "/" + options.name + '.svg' : undefined,
					source: result
				});
			}
			var ttf = svg2ttf(result);
			if (options.output.includes("ttf")) {
				console.log(options.name + ".ttf - " + filesize(ttf.length));
				refs.ttf = this.emitFile({
					type: 'asset',
					name: options.name + '.ttf',
					fileName: options.outDir ? options.outDir + "/" + options.name + '.ttf' : undefined,
					source: Buffer.from(ttf.buffer)
				});
			}
			if (options.output.includes("woff2")) {
				var woff2 = ttf2woff2(ttf.buffer);
				console.log(options.name + ".woff2 - " + filesize(woff2.length));
				refs.woff2 = this.emitFile({
					type: 'asset',
					name: options.name + '.woff2',
					fileName: options.outDir ? options.outDir + "/" + options.name + '.woff2' : undefined,
					source: Buffer.from(woff2.buffer)
				});
			}
			if (options.output.includes("woff")) {
				var woff = ttf2woff(ttf.buffer);
				console.log(options.name + ".woff - " + filesize(woff.length));
				refs.woff = this.emitFile({
					type: 'asset',
					name: options.name + '.woff',
					fileName: options.outDir ? options.outDir + "/" + options.name + '.woff' : undefined,
					source: Buffer.from(woff.buffer)
				});
			}
			if (options.output.includes("eot")) {
				var eot = ttf2eot(ttf.buffer);
				console.log(options.name + ".ttf - " + filesize(eot.length));
				refs.eot = this.emitFile({
					type: 'asset',
					name: options.name + '.eot',
					fileName: options.outDir ? options.outDir + "/" + options.name + '.eot' : undefined,
					source: Buffer.from(eot.buffer)
				});
			}
			if (options.css) {
				var map = cssMap.get(css.name);
				if (!map) {
					map = new Map();
					cssMap.set(css.name, map);
				}
				var map_compat;
				if (css.compat) {
					map_compat = cssCompatMap.get(css.name);
					if (!map_compat) {
						map_compat = new Map();
						cssCompatMap.set(css.name, map_compat);
					}
				} else if (css.compat !== false) {
					map_compat = map;
				}
				var cssOut;
				var common = [];
				if (css.common) {
					common.push("." + css.common.name);
				}
				unicodeMap.forEach(function(char, name) {
					if (!exps.has(name)) {
						return;
					}
					cssOut = [];
					//.fa-envira:before{ content:"\f299";}
					var className = "." + css.prefix + name;
					cssOut.push(className + ':before{ content:"' + char + '"}');
					if (css.compat !== false) {
						//.fa-glass{ *zoom:expression(this.runtimeStyle['zoom']='1',this.innerHTML='&#xf000;')}
						map_compat.set(className, className + "{ *zoom:expression(this.runtimeStyle['zoom']='1',this.innerHTML='" + char + "')}");
					}
					if (!css.common) {
						common.push(className);
					}
					map.set(className, cssOut.join("\n"));
				});
				cssOut = [];
				cssOut.push(`@font-face {\n	font-family: "${options.name}";`);
				if (refs.eot) {/* IE9 */
					cssOut.push(`	src: url('${basename(this.getFileName(refs.eot))}');`);
				}
				var fontValues = [];
				if (refs.eot) {/* IE6-IE8 */
					fontValues.push(`url('${basename(this.getFileName(refs.eot))}#iefix') format('embedded-opentype')`);
				}
				if (refs.woff2) {
					fontValues.push(`url('${basename(this.getFileName(refs.woff2))}') format('woff2')`);
				}
				if (refs.woff) {
					fontValues.push(`url('${basename(this.getFileName(refs.woff))}') format('woff')`);
				}
				if (refs.ttf) {/* chrome, firefox, opera, Safari, Android, iOS 4.2+ */
					fontValues.push(`url('${basename(this.getFileName(refs.ttf))}') format('truetype')`);
				}
				if (refs.svg) {/* iOS 4.1- */
					fontValues.push(`url('${basename(this.getFileName(refs.svg))}#${fontId}') format('svg')`);
				}
				cssOut.push(`	src: ${fontValues.join(",")};\n}`);
				var fontDefine = common.join(",") +
					`{
	font-family: "${options.name}" !important;
	font-style: normal;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}`;
				cssOut.push(fontDefine);
				if (css.common) {
					map.set("." + css.common.name, cssOut.join("\n"));
				} else {
					map.set(fontId, cssOut.join("\n"));
				}
				if (options.output.includes("css")) {
					var fileId;
					if (options.outDir) {
						this.emitFile({
							type: 'asset',
							fileName: options.outDir + "/" + css.name + '.css',
							source: Array.from(map.values()).join("\n")
						});
					} else {
						fileId = this.emitFile({
							type: 'asset',
							name: css.name + '.css',
							source: Array.from(map.values()).join("\n")
						});
						cssFileNameMap.set(css.name, this.getFileName(fileId));
					}
					if (css.compat) {
						var cssOut_compat = [
							`@font-face {
	font-family: "${options.name}";
	src:url('${basename(this.getFileName(refs.eot))}#iefix') format('embedded-opentype');
}`
						];
						cssOut_compat.push(fontDefine);
						if (css.common) {
							map_compat.set("." + css.common.name, cssOut_compat.join("\n"));
						} else {
							map_compat.set(fontId, cssOut_compat.join("\n"));
						}
						if (options.outDir) {
							this.emitFile({
								type: 'asset',
								fileName: options.outDir + "/" + css.name + '.css',
								source: Array.from(map_compat.values()).join("\n")
							});
						} else {
							fileId = this.emitFile({
								type: 'asset',
								name: css.name + '.css',
								source: Array.from(map_compat.values()).join("\n")
							});
							cssCompatFileNameMap.set(css.name, this.getFileName(fileId));
						}
					}
				}
			}
		}
	};
}
function find(node, name) {
	return node.elements.find(function(node) {
		return node.name === name;
	});
}

font.default = font;
font.getCssFile = function(name) {
	return cssFileNameMap.get(name);
};
font.getCompatCssFile = function(name) {
	return cssCompatFileNameMap.get(name);
};
module.exports = font;