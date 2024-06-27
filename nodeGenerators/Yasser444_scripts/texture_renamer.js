const fs = require("node:fs")

const items = '../../BP/items';
const item_shortnames = []
fs.readdirSync(items).forEach(item=>{
    const path = [items,item].join('/')
    const content = JSON.parse(fs.readFileSync(path, {encoding:'utf8'}));
    const name = content['minecraft:item'].description.identifier.replace('cosmos:', '');
    const texture = content['minecraft:item'].components["minecraft:icon"].texture
    if (name == "ui") return
    if (name == texture) return
    item_shortnames.push([name, texture])
    content['minecraft:item'].components["minecraft:icon"].texture = name
    fs.writeFileSync(path, JSON.stringify(content, null, 2))
    const new_path = `../../BP/items/${name}.json`
    if (fs.existsSync(path))  fs.renameSync(path, new_path)
})

//changes the item_texture.json file
const item_texture = '../../RP/textures/item_texture.json'
const item_textures = JSON.parse(fs.readFileSync(item_texture, {encoding:'utf8'}))
const old_textures = []
item_shortnames.forEach(item => {
    const [name, texture] = item
    old_textures.push([name, item_textures.texture_data[texture].textures.replace('textures/items/', '')])
    delete item_textures.texture_data[texture]
    item_textures.texture_data[name] = { textures: 'textures/items/' + name }
    
})
fs.writeFileSync(item_texture, JSON.stringify(item_textures,null,2))


//renames the item PNG files 
const textures = '../../RP/textures/items'
old_textures.forEach(item => {
    const [new_path, old_path] = item.map(name => [textures, name].join('/') + '.png')
    if (fs. existsSync(old_path))  fs.renameSync(old_path, new_path)
})