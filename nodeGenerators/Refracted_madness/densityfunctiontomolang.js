"use strict";

const fs = require("fs");
const path = require("path");
const { densityToMolang } = require("./worldgenconverter.js");

if (process.argv.length < 3) {
  console.error("Usage: node convertDensityToMolang.js <inputFile>");
  process.exit(1);
}

const inputFile = process.argv[2];
const densityContent = fs.readFileSync(inputFile, "utf8");
const densityJson = JSON.parse(densityContent);
const molangCode = densityToMolang(densityJson);
const outputPath = path.join(path.dirname(inputFile), "molang_output.txt");
fs.writeFileSync(outputPath, molangCode);
console.log("Converted Density Function JSON back to Molang code written to:", outputPath);
//to run, use this node molangtodensityfunction.js densityfunction.json
