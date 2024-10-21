
const fs = require('node:fs')

const {id_to_name, read_json, get_folders, make_comments} = require('./utils.js')

function generate_block_names() {
    const path = '../../BP/blocks/block_placeholders/'
    const blocks = fs.readdirSync(path)
    for (const block of blocks) {
        if (!block.endsWith('.json')) continue
        const json = read_json(path + block)
        const id = json['minecraft:block'].description.identifier
        const name = id_to_name(id)
        console.log(`tile.${id}.name=${name}`)
    }
}

function generate_terrain_textures() {
    const content = {
        num_mip_levels: 4,
        padding: 8,
        resource_pack_name: "Cosmos-Adventure",
        texture_name: "atlas.terrain",
        texture_data: {},
    }
    function add_textures(path, group, variant) {
        fs.readdirSync(path).forEach(file => {
            if (!file.endsWith('.png')) return
            const shortname = (variant ? `${variant}_` : '') + file.replace('.png', '')
            const file_path = (group ? group + '/' : '') + (variant ? variant + '/' : '') + file.replace('.png', '')
            content.texture_data[shortname] = {textures: `textures/blocks/${file_path}`}
        })
    }
    //manages stray textures
    const path = "../../RP/textures/blocks/"
    add_textures(path)
    //manages textures inside the folders
    for (const group of get_folders(path)) {
        if (group == 'flipbooks') continue
        const group_path = path + group + '/'
        content.texture_data['linebreak_' + group_path] = ''
        content.texture_data['comment_' + group_path] = group
        add_textures(group_path, group)
        //manages textures inside subfolders
        for (const variant of get_folders(group_path)) {
            const variant_path = group_path + variant + '/'
            content.texture_data['linebreak_' + variant_path] = ''
            add_textures(variant_path, group, variant)
        }
    }
    fs.writeFileSync(`../../RP/textures/terrain_texture.json`, make_comments(JSON.stringify(content, null, 2))) 
}

module.exports = {generate_block_names, generate_terrain_textures}