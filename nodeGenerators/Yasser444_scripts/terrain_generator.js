/*
# How To Use
    - add png files to RP/textures/blocks and run this
    - the name of the png can be used in block.json and material_instances
    - you can add folders containing png files to group similar textures together
    - any folders inside the branched folder will be considered as variant folders
    - png files inside variant folders can be used as `folder_name`_`file_name`
    - eg: textures/blocks/machines/energy_storage_module/0 can be used as energy_storage_module_0
 */


const fs = require('node:fs')

function modify_json(string) {
    const lines = string.split('\n')
    for (let [i, line] of lines.entries()) {
        const property = line.split(": \"").shift()
        //break line
        if (line.includes("leave_space")) lines[i] = ''
        //leave comment
        if (property.includes("add_comment")) {
            let comment = line.replace(property + ": \"", '')
            comment = comment.split(''); comment.pop(); comment.pop()
            lines[i] = '\n// ' + comment.join('')
        }

    } return lines.join('\n')
}

function add_textures(to, subfolder, from, variant=null) {
    fs.readdirSync(from).forEach(file => {
        if (file.endsWith('.png')) {
            file = file.replace('.png', '')
            if (variant) to.texture_data[`${variant}_${file}`] = {textures: `textures/blocks/${subfolder}/${file}`}
            else to.texture_data[file] = {textures: `textures/blocks/${subfolder}${subfolder ? '/' : ''}${file}`}
        }
    })
}

function get_folders(path) {
    return fs.readdirSync(path, { withFileTypes: true })
        .filter(item => item.isDirectory() && item.name != "flipbooks")
        .map(item => item.name)
}

const textures = "../../RP/textures/blocks"
const content = {
    num_mip_levels: 4,
    padding: 8,
    resource_pack_name: "Cosmos-Adventure",
    texture_data: {},
}
add_textures(content, '', textures)

for (const folder of get_folders(textures)) {
    content.texture_data[textures + folder] = "leave_space"
    const path = [textures, folder].join('/')
    add_textures(content, folder, path)
    for (const variant of get_folders(path)) {
        content.texture_data[textures + folder + variant] = "leave_space"
        const path = [textures, folder, variant].join('/')
        add_textures(content, [folder, variant].join('/'), path, variant)
    }
}
content.texture_name = "atlas.terrain"
fs.writeFileSync(`../../RP/textures/terrain_texture.json`, modify_json(JSON.stringify(content, null, 2)), {flag: 'w'}) 

// console.log(content)