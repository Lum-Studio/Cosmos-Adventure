"use strict";

const fs = require("fs");
const path = require("path");
const { molangToDensity } = require("./worldgenconverter.js");

if (process.argv.length < 3) {
  console.error("Usage: node convertMolangToDensity.js <inputFile>");
  process.exit(1);
}

const inputFile = process.argv[2];
const molangContent = fs.readFileSync(inputFile, "utf8");
const densityJson = molangToDensity(molangContent);
const outputPath = path.join(path.dirname(inputFile), "density_output.json");
fs.writeFileSync(outputPath, JSON.stringify(densityJson, null, 2));
console.log("Converted Molang to Density Function JSON written to:", outputPath);
//to run, use this node densityfunctiontomolang.js input_molang.txt
