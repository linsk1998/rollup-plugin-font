
var { createFilter} =require('rollup-pluginutils');
var {readFileSync,writeFileSync,mkdirSync}=require('fs');
var {resolve,basename}=require('path');
var convert = require('xml-js');
var filesize = require("filesize");
var svg2ttf = require('svg2ttf');
var ttf2woff2 = require('ttf2woff2');
var ttf2woff = require('ttf2woff');
var ttf2eot = require('ttf2eot');


module.exports=function font(options = {}) {
	const filter = createFilter(options.include, options.exclude);
	if(!options.svg){
		throw new Error("options.svg is undefined");
	}
	if(!options.formats){
		options.formats=['svg', 'ttf', 'eot', 'woff', 'woff2'];
	}
	return {
		name: 'rollup-plugin-font',
		renderChunk(code, chunk){
			var exps=new Set();
			//console.log(chunk);
			for(var key of Object.keys(chunk.modules)){
				if (!filter(key)) continue ;
				var module=chunk.modules[key];
				module.renderedExports.forEach(function(name){
					name=name.replace(/_/g,"-").replace(/[A-Z]{1}/g,function(word){
						return "-"+word.toLowerCase();
					}).toLowerCase();
					exps.add(name);
				});
			}
			console.log("found "+exps.size+" icons need");
			if(exps.size===0) return ;
			var xml = readFileSync(resolve("./",options.svg));
			var base=basename(options.svg, '.svg');
			var json = convert.xml2js(xml, { alwaysChildren: true});
			var font=find(find(find(json,"svg"),"defs"),"font");
			var id=font.attributes.id;
			//console.log("before svg file has "+font.elements.length+" icons");
			var count=0;
			font.elements=font.elements.filter(function(ele){
				if(ele.type==='element'){
					if(ele.name==='glyph'){
						var name=ele.attributes['glyph-name'];
						if(exps.has(name)){
							count++;
							return true;
						}
						return false;
					}else if(ele.name==="font-face"){
						if(ele.attributes['font-family']!==id){
							ele.attributes['font-family']=id;
						}
					}
				}
				return true;
			});
			if(count===0){
				console.log("no font found in "+base);
				return ;
			}
			var result = convert.json2xml(json);
			var outDir=resolve("./",options.outDir);
			mkdirSync(outDir, { recursive: true } );
			if(options.formats.includes("svg")){
				console.log(base+".svg - "+filesize(result.length));
				writeFileSync(outDir+"/"+base+".svg",result);
			}
			var ttf = svg2ttf(result);
			if(options.formats.includes("ttf")){
				console.log(base+".ttf - "+filesize(ttf.length));
				writeFileSync(outDir+"/"+base+".ttf", new Buffer(ttf.buffer));
			}
			if(options.formats.includes("woff2")){
				var woff2=ttf2woff2(ttf.buffer);
				console.log(base+".woff2 - "+filesize(woff2.length));
				writeFileSync(outDir+"/"+base+".woff2", new Buffer(woff2.buffer));
			}
			if(options.formats.includes("woff")){
				var woff=ttf2woff(ttf.buffer);
				console.log(base+".woff - "+filesize(woff.length));
				writeFileSync(outDir+"/"+base+".woff", new Buffer(woff.buffer));
			}
			if(options.formats.includes("eot")){
				var eot=ttf2eot(ttf.buffer);
				console.log(base+".ttf - "+filesize(eot.length));
				writeFileSync(outDir+"/"+base+".eot", new Buffer(eot.buffer));
			}
		}
	};
}
function find(node,name){
	return node.elements.find(function(node){
		return node.name===name;
	});
}