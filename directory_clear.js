const fs = require('fs');
const path = require('path');

// Base path for Minecraft Bedrock Edition packs
const basePath = "C:\\Users\\ADMIN\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang";

// Directories to check
const packFolders = ["behavior_packs", "resource_packs"];

// Name of the folder to delete
const folderToDelete = "CosmosAdve";

packFolders.forEach(packFolder => {
  const folderPath = path.join(basePath, packFolder, folderToDelete);

  if (fs.existsSync(folderPath)) {
    // Remove the folder recursively
    fs.rm(folderPath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error(`Error deleting folder at ${folderPath}:`, err);
      } else {
        console.log(`Successfully deleted folder: ${folderPath}`);
      }
    });
  } else {
    console.log(`Folder not found: ${folderPath}`);
  }
});
