const fs = require('node:fs')

let sizeOf; try { sizeOf = require('image-size') } catch(e) {
    console.log(`${yellow}Please install image-size, run the following command to install it:\n${cyan}npm install image-size${white}`)
    return
}

const white = '\x1b[0m'
const cyan = '\x1b[36m'
const yellow = '\x1b[33m'

function generate_attachables() {
    const path = "../../RP/textures/items/"
    const items32 = fs.readdirSync(path)
    .filter(item => item.endsWith('.png'))
    .filter(item => JSON.stringify(sizeOf(`${path}/${item}`)) == `{"height":32,"width":32,"type":"png"}`)
    .map(item => item.replace('.png', ''))

    items32.forEach(item => {
        if (fs.existsSync(`../../RP/attachables/${item}.json`)) return
        const id = "cosmos:" + item
        const texture = 'textures/items/' + item
        const content = {
            "format_version": "1.10.0",
            "minecraft:attachable": {
                description: {
                    identifier: id,
                    materials: { default: "entity_alphatest", enchanted: "entity_alphatest_glint" },
                    textures: { default: texture, enchanted: "textures/misc/enchanted_item_glint" },
                    geometry: { default: "geometry.item32" },
                    animations: { hold: "animation.item32.hold" },
                    scripts: { animate: [ "hold" ] },
                    render_controllers: [ "controller.render.item32" ]
                }
            }
        }
        fs.writeFileSync(`../../RP/attachables/item32/${item}.json`, JSON.stringify(content,null,2))
    })
}

module.exports = { generate_attachables }