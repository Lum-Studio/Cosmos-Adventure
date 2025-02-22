
const white = '\x1b[0m'
const cyan = '\x1b[36m'
const yellow = '\x1b[33m'

const apps = [
    { name: 'help', desc: 'shows this message'},
    { name: 'find_unused', desc: 'returns the pngs for the unused textures'},
    { name: 'generate_block_names', desc: 'makes the translation keys from the BP/blocks/block_placeholders folder'},
    {
        name: 'generate_terrain_textures',
        desc: `writes the RP/textures/terrain_texture.json file out of the PNGs placed inside RP/textures/blocks
# How To Use:
- Add your PNG files to RP/textures/blocks or a subfolder of it
- Do not add PNGs with similar names inside different subfolders
- The PNG name is the same name which can be used in block.json and material_instances
- PNGs added to a subfolder of the subfolder are variants and will have a shortname in this format: \`folder_name\`_\`file_name\`
- For instance: the texture "textures/blocks/machines/energy_storage_module/00.png" will have the shortname: "energy_storage_module_00"`
    },
    {
        name: 'generate_attachables',
        desc: `creates attachable folders for items with icon size of 32x32`
    }
]

function help() {
    apps.forEach(app => {
        console.log(`${cyan}$node ./run.js ${app.name}`)
        console.log(`${yellow}> ${app.desc}`)
        console.log(white)
    })
}
const { generate_block_names, generate_terrain_textures, find_unused } = require('./scripts/blocks_generator.js')
const { generate_attachables } = require('./scripts/items_generator.js')



if (!apps.map(i=>i.name).includes(process.argv[2])) console.log("please choose one of the following apps:\n" +cyan+ apps.map(app => app.name).join(' - ') + white)
else eval(process.argv[2] + '()')

//console.log(fs.readdirSync('.'))