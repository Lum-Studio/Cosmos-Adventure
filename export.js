// Usage: node export.js [<filename>]

const walk = require("walk");
const path = require("path");
const JSZip = require("jszip");
const fs = require("fs");

const exportAddon = async (filename) => {
  const zip = new JSZip();
  const saveZipFileAs = (zip) => { saveZipFile(zip, filename) };
  exportFolder(zip, "RP", (zip) => { exportFolder(zip, "BP", saveZipFileAs) });
};

const exportFolder = async (zip, folder, callback) => {
  const walker = walk.walk(folder);

  walker.on("file", (root, fileStats, next) => {
    const filePath = path.join(root, fileStats.name);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        zip.file(filePath, data);
      };
    });
    next();
  });

  walker.on("directory", (root, dirStats, next) => {
    const dirPath = path.join(root, dirStats.name);
    console.log("Adding files from directory:", dirPath);
    next();
  });

  walker.on("end", () => { callback(zip); });
};

const saveZipFile = (zip, filename) => {
  console.log("Saving addon to", filename);
  zip.generateAsync({ type: "uint8array" }).then(function (content) {
    fs.writeFile(filename, content, (err) => {
      if (err) {
        console.log(err);
      };
    });
  });
};

exportAddon(process.argv[2] || "Galacticraft.mcaddon");