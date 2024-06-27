const fs = require("node:fs")
const sizeOf = require('image-size')

const items32 = fs.readdirSync("../../RP/textures/items", { withFileTypes: true }).filter(item => JSON.stringify(sizeOf(`${item.parentPath}/${item.name}`)) == `{"height":32,"width":32,"type":"png"}`).map(item => item.name.replace('.png', ''))

items32.forEach(item => {
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
    fs.writeFileSync(`../../RP/attachables/${item}.json`, JSON.stringify(content,null,2))
})