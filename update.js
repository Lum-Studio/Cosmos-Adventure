// Usage: node update.js

const walk = require("walk");
const path = require("path");
const fs = require("fs");

const updateAddon = async (path) => {
  const RP = path + "development_resource_packs/RP/";
  const BP = path + "development_behavior_packs/BP/";
  fs.rm(RP, { recursive: true, force: true }, () => { copyFolder("RP", RP) });
  fs.rm(BP, { recursive: true, force: true }, () => { copyFolder("BP", BP) });
};

const copyFolder = async (src, des) => {
  fs.mkdirSync(des);
  const walker = walk.walk(src);
  const n = src.length + 1;

  walker.on("file", (root, fileStats, next) => {
    const filePath = path.join(root, fileStats.name);
    fs.copyFile(filePath, des + filePath.substring(n), (err) => {
      if (err) {
        console.log(err);
      };
    });
    next();
  });

  walker.on("directory", (root, dirStats, next) => {
    const dirPath = path.join(root, dirStats.name);
    const target = des + dirPath.substring(n);
    console.log("Adding files from directory:", dirPath);
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target);
    };
    next();
  });
};

const mojang = path.join(process.env.LOCALAPPDATA, "/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/");
updateAddon(mojang);