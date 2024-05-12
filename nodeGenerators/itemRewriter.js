import fs from 'fs'
import path from 'path';
const dir = './BP/items';

fs.readdirSync(dir).forEach(file=>{
    const filePath = path.join(dir,file)
    const fileContent = JSON.parse(fs.readFileSync(filePath,{encoding:'utf8'}));
    const description = fileContent['minecraft:item'].description;
    if (description.identifier.startsWith('cosmos')) return;
    description.identifier = description.identifier.replace('galacticraft','cosmos');
    fs.writeFileSync(filePath,JSON.stringify(fileContent,null,2))
});
console.warn('Item files have been rewritten!')