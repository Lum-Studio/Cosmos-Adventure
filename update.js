// Usage: node update.js [--preview]

const path = require("path");
const fs = require("fs");

const updateAddon = async (mojang) => {
  const RP = path.join(mojang, "development_resource_packs/RP/");
  const BP = path.join(mojang, "development_behavior_packs/BP/");

  fs.rm(RP, { recursive: true, force: true }, () => {
    console.log("Removed directory", RP);
    fs.cpSync("RP", RP, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
      };
    });
    console.log("Copied contents of RP\\ to", RP);
  });

  fs.rm(BP, { recursive: true, force: true }, () => {
    console.log("Removed directory", BP);
    fs.cpSync("BP", BP, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
      };
    });
    console.log("Copied contents of BP\\ to", BP);
  });
};

const mojangFolder = (preview) => {
  return path.join(process.env.LOCALAPPDATA, `/Packages/Microsoft.Minecraft${ preview ? "WindowsBeta" : "UWP" }_8wekyb3d8bbwe/LocalState/games/com.mojang/`);
};

updateAddon(mojangFolder(process.argv[2] == "--preview"));