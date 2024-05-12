import fs from "fs";
import path from "path";
import Jimp from "jimp";

/**
 * Convert a .obj file to a .json Minecraft model
 * @param {string} objFileContent
 * @param {string} texturePath - Path to the texture file
 * @param {string} modelId
 * @param {number} scale
 * @returns {Promise<Object>}
 */
async function OBJtoMC(objFileContent, texturePath, modelId, scale = 1) {
  let positions = [];
  let normals = [];
  let uvs = [];
  let polys = [];
  const bones = [];

  try {
    const image = await getImage(texturePath);
    // Get width & height
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    objFileContent.split(/\r\n|\n/g).forEach((line) => {
      const [defType, data] = line.trim().split(/\s(.+)/);
      switch (defType) {
        case "v":
          positions.push(
            data.split(" ").map((str, i) => (i === 0 ? -scale : scale) * Number(str))
          );
          break;
        case "vn":
          normals.push(
            data.split(" ").map((str, i) => (i === 0 ? -1 : 1) * Number(str))
          );
          break;
        case "vt":
          uvs.push(data.split(" ").map(Number));
          break;
        case "f":
          const face = data
            .split(" ")
            .map((index) => {
              const [v, vt, vn] = index.split("/").map(Number);
              return [v - 1, vn - 1, vt - 1];
            });
          // Minecraft currently doesn't support triangular shapes
          while (face.length <= 3) face.push(face[0]);
          while (face.length > 4) face.pop();
          polys.push(face);
          break;
      }
    });

    if (polys.length > 0) {
      bones.push({
        name: "body",
        poly_mesh: {
          normalized_uvs: true,
          positions,
          normals,
          uvs,
          polys,
        },
      });
    }
    return {
      format_version: "1.12.0",
      "minecraft:geometry": [
        {
          description: {
            identifier: modelId,
            texture_width: width,
            texture_height: height,
          },
          bones,
        },
      ],
    };
  } catch (error) {
    console.error("Error processing texture:", error);
    return null;
  }
}

/**
 * A function that turns a texture path into a Jimp image
 * @param {string} filePath - Path to the image file
 * @returns {Promise<Jimp>}
 */
function getImage(filePath) {
  return Jimp.read(filePath);
}


async function generateModels() {
  const objFiles = fs.readdirSync("./models", { withFileTypes: true })
    .filter((dir) => dir.name.endsWith(".obj"));

  await Promise.all(objFiles.map(async (dir) => {
    if (dir.isDirectory()) return;
    const transformedName = dir.name.replace('.obj', '');
    const objFilePath = path.join("./models", dir.name);
    const objFileContent = fs.readFileSync(objFilePath, "utf8");
    const textureFiles = walkDir("./blocks")
    const textureFile = textureFiles.find(texture => texture.name.includes(transformedName + '.png'));

    if (textureFile) {
      const textureFilePath = path.resolve(textureFile.path,textureFile.name);
      const genModels = await OBJtoMC(objFileContent, textureFilePath, `galaticraft:${transformedName}`);
      fs.mkdirSync('./RP/models',{recursive:true})
      fs.writeFileSync(`./RP/models/${transformedName}.json`, JSON.stringify(genModels,null,2));
    } else {
     const name = objFileContent.split('#')[1].split(':').pop().replace('.blend','')
     if (name && name.length > 0){
      const textureFile = textureFiles.find(texture => texture.name.includes(name));
      console.warn(textureFile)
      if (textureFile){
      const textureFilePath = path.resolve(textureFile.path,textureFile.name);
      const genModels = await OBJtoMC(objFileContent, textureFilePath, `galaticraft:${transformedName}`);
      fs.mkdirSync('./RP/models',{recursive:true})
      fs.writeFileSync(`./RP/models/${transformedName}.json`, JSON.stringify(genModels,null,2));
      }
     }
    }
  }));
}


generateModels().catch((error) => {
  console.error("Error generating models:", error);
});



/**
 * Recursively walks through a directory and returns all files
 * @param {string} dirPath
 * @returns {Dirent[]}
 */
function walkDir(dirPath) {
  let files = [];
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dir) => {
    switch (dir.isDirectory()) {
      case true:
        files.push(...walkDir(path.join(dirPath, dir.name)));
        break;
      case false:
        files.push(dir);
        break;
    }
  });
  return files;
}
