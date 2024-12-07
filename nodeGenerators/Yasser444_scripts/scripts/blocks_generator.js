
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

function find_unused() {
    const terrain_texture = read_json('../../RP/textures/terrain_texture.json')
    const all_textures = Object.keys(terrain_texture.texture_data)

    let rp_blocks = read_json('../../RP/blocks.json')
    delete rp_blocks.format_version
    rp_blocks = Object.values(rp_blocks).map(block => block.textures)
    .map(block => typeof block == 'object' ? Object.values(block) : block)
    .filter(i => i).flat().sort()
    rp_blocks = [...new Set(rp_blocks)]

    function get_blocks(path) {
        const blocks = []
        fs.readdirSync(path).forEach(file => {
            if (file.endsWith('.json')) blocks.push(path + file)
            else blocks.push(get_blocks(path + file + '/'))
        })
        return blocks.flat()
    }

    let bp_blocks = get_blocks('../../BP/blocks/').map(file => {
        const materials = read_json(file)['minecraft:block'].components['minecraft:material_instances']
        let permutations = read_json(file)['minecraft:block'].permutations
        if (permutations) permutations = permutations.map(perm => perm.components?.['minecraft:material_instances'])
        const all_materials = [materials, permutations].flat()
        return all_materials.filter(i => i).map(material => Object.values(material).map(material => material.texture))
    }).flat().flat().sort()
    bp_blocks = [...new Set(bp_blocks)]

    const used_textures = bp_blocks.concat(rp_blocks)

    const unused_textures = all_textures.filter(texture => !used_textures.includes(texture))
    console.log(unused_textures)
}

module.exports = {generate_block_names, generate_terrain_textures, find_unused}