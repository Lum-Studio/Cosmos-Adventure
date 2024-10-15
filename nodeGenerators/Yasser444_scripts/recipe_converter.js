const fs = require('node:fs')
const { ids:id_map } = require("./java_to_bedrock_map.js")
const { text } = require('stream/consumers')

//UTILITY FUNCTIONS
function id_to_name(id) {
    if (id) return id.split(':')[1].replaceAll('_', ' ').replace(/\b\w/g, s => s.toUpperCase())
}

function strip_json(string) {
    if (typeof string != 'string') return
    return string.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m)
}
function clean_array(array) {
    return [...new Set(array)]
}
function item_with_data(item) {
    if (item.item) return item.item + (item.data ? ':' + item.data : '')
    if (item.type) return item.type + (item.metal ? (':' + item.metal) : item.ore ? (':' + item.ore) : '')
}
function map_to_bedrock(id) {
    if (id.startsWith('minecraft:')) return id
    else return id_map[id]
}


const unique_ids = []
function avoid_dupes(id) {
    if (unique_ids.includes(id)) id += '_alt'
    unique_ids.push(id)
    return id
}


function extract_ids_from_recipes() {
    const unworked_files = []
    const ids = []

    fs.readdirSync("java_recipes/").forEach(file_name => {
        const file_json = JSON.parse(fs.readFileSync('java_recipes/' + file_name, { encoding: 'utf8' }))
        if (!file_json.type) unworked_files.push(file_name)
        else {
            if (item_with_data(file_json.result) == undefined) console.log(file_name)
            ids.push(item_with_data(file_json.result))
            if (file_json.key) {
                Object.values(file_json.key).forEach(item => {
                    if (item_with_data(item) == undefined) console.log(file_name)
                    ids.push(item_with_data(item))
                })
            }
            if (file_json.ingredients) {
                file_json.ingredients.forEach(item => {
                    if (item_with_data(item) == undefined) console.log(file_name)
                    ids.push(item_with_data(item))
                })
            }
        }
    })
    const no_dupes = clean_array(ids).sort()
    const no_vanilla = no_dupes.filter(id => !id.startsWith("minecraft:"))
    const unknown = no_vanilla.filter(id => !Object.keys(id_map).includes(id))
    unknown.forEach(id => console.log(id))
    //console.log(unworked_files)
}


function generate_bedrock_recipe() {
    existing_recipes = ['aluminum_wire_item.json']
    
    const find_recipes = (path) => {
        fs.readdirSync(path).forEach(file => {
            if (fs.lstatSync(path + file).isDirectory()) find_recipes(path + file + '/')
            else {
                existing_recipes.push(file)
            } 
        })
    }
    find_recipes("../../BP/recipes/")

    fs.readdirSync("java_recipes/").forEach(file_name => {
        const file_json = JSON.parse(fs.readFileSync('java_recipes/' + file_name, { encoding: 'utf8' }))
        const result = map_to_bedrock(item_with_data(file_json.result))
        if (!result) return
        const id = avoid_dupes(result)
        const new_file_name = id.replace('cosmos:', '').replaceAll(':', '_') + '.json'
        if (existing_recipes.includes(new_file_name)) return
        const content = {"format_version": "1.20.10"}
        const keys = file_json.key
        if (keys) Object.keys(keys).forEach(key => {
            keys[key] = map_to_bedrock(item_with_data(keys[key]))
        })
        let ingredients = file_json.ingredients
        if (ingredients) ingredients = ingredients.map(item => map_to_bedrock(item_with_data(item)))
        if (file_json.pattern) content["minecraft:recipe_shaped"] = {
            description: { identifier: id },
            tags: [ "crafting_table" ],
            pattern: file_json.pattern,
            key: keys,
            unlock: [Object.values(keys).find(key => key?.startsWith('cosmos:')) ?? Object.values(keys)[0]],
            result: {
                item: result,
                count: file_json.result.count
            }
        }
        if (file_json.ingredients) content["minecraft:recipe_shapeless"] = {
            description: { identifier: id },
            tags: [ "crafting_table" ],
            ingredients: ingredients,
            unlock: [ ingredients.find(item => item?.startsWith('cosmos:')) ?? ingredients[0] ],
            result: {
                item: result,
                count: file_json.result.count
            }
        }
        if (content["minecraft:recipe_shaped"] && !content["minecraft:recipe_shaped"].unlock) console.log(file_name)
        //if (content["minecraft:recipe_shapeless"]) console.log(content["minecraft:recipe_shapeless"])
        fs.writeFileSync(`bedrock_recipes/${new_file_name}`, JSON.stringify(content, null, 2))
    })
}

function generate_placeholders() {
    const existing_ids = []
    fs.readdirSync("../../BP/items/").forEach(file_name => {
        if (!file_name.endsWith('.json')) return
        const item_json = JSON.parse(strip_json(fs.readFileSync("../../BP/items/" + file_name, { encoding: 'utf8' })))
        existing_ids.push(item_json["minecraft:item"].description.identifier)
    })
    fs.readdirSync("../../BP/items/placeholders/").forEach(file_name => {
        if (!file_name.endsWith('.json')) return
        const item_json = JSON.parse(strip_json(fs.readFileSync("../../BP/items/placeholders/" + file_name, { encoding: 'utf8' })))
        existing_ids.push(item_json["minecraft:item"].description.identifier)
    })
    const recrute = (path) => {
        fs.readdirSync(path).forEach(file => {
            if (fs.lstatSync(path + file).isDirectory()) recrute(path + file + '/')
            else {
                const block_json = JSON.parse(strip_json(fs.readFileSync(path + file, { encoding: 'utf8' })))
                existing_ids.push(block_json["minecraft:block"].description.identifier)
            } 
        })
    }
    recrute("../../BP/blocks/")
    
    //existing_ids.forEach(id => console.log(id))
    
    clean_array(Object.values(id_map)).forEach(id => {
        if (id.startsWith("minecraft:")) return
        if (existing_ids.includes(id)) return
        const content = {
            format_version: "1.20.20",
            "minecraft:item": {
                description: {
                    identifier: id
                },
                components: {
                    "minecraft:icon": {
                        "texture": id.split(':')[1]
                    }
                }
            }
        }
        fs.writeFileSync(`placeholder_items/${id.replace('cosmos:', '')}.json`, JSON.stringify(content, null, 2))
    })
}

function generate_lang_keys() {
    const keys = []
    fs.readdirSync("../../BP/items/placeholders/").forEach(file_name => {
        if (!file_name.endsWith('.json')) return
        const item_json = JSON.parse(strip_json(fs.readFileSync("../../BP/items/placeholders/" + file_name, { encoding: 'utf8' })))
        const id = item_json["minecraft:item"].description.identifier
        keys.push('item.' + id + '=' + id_to_name(id))
        fs.writeFileSync('en_US.lang', keys.join('\n'))
    })
}

function generate_textures() {
    const textures = {}
    fs.readdirSync("../../BP/items/placeholders/").forEach(file_name => {
        if (!file_name.endsWith('.json')) return
        const item_json = JSON.parse(strip_json(fs.readFileSync("../../BP/items/placeholders/" + file_name, { encoding: 'utf8' })))
        const id = item_json["minecraft:item"].description.identifier
        textures[id.split(':')[1]] = { textures: "textures/items/" + [id.split(':')[1]] }
        fs.writeFileSync('item_textures.json', JSON.stringify(textures, null, 2))
    })
}

// generate_bedrock_recipe()
// extract_ids_from_recipes()
// generate_placeholders()
// generate_lang_keys()
// generate_textures()


//QUICK MASS EDITOR (be careful, there is no undo lol)

// const json = JSON.parse(strip_json(fs.readFileSync('../../RP/textures/item_texture.json', { encoding: 'utf8' })))
// const existing_textures = Object.values(json.texture_data)
//const texture_shortnames = Object.keys(json.texture_data)

//texture_shortnames.forEach(name => console.log(name))

// const existing_shortnames = ``.split('\n')
// texture_shortnames.forEach(shortname => {
//     if (!existing_shortnames.includes(shortname)) delete json.texture_data[shortname]
// })
// fs.writeFileSync('../../RP/textures/item_texture.json', JSON.stringify(json, null, 2))

//existing_textures.map(t => t.textures).forEach(t => console.log(t))
// const path = '../../RP/textures/items/'
// fs.readdirSync(path).forEach(file => {
//     if (!file.endsWith('.png')) return
//     const texture = 'textures/items/' + (file.replace('.png', ''))
//     //console.log(texture)
//     if (!existing_textures.map(t => t.textures).includes(texture)) fs.rmSync('../../RP/textures/items/' + file)
//     // if (!file.endsWith('.json')) return
//     // const json = JSON.parse(fs.readFileSync(path + file, { encoding: 'utf8' }))
//     // //{
//     // const components = json['minecraft:item'].components
//     // delete json['minecraft:item'].components
//     // delete components["minecraft:display_name"]
//     // json['minecraft:item'].components = components
//     // //}
//     // fs.writeFileSync(path + file, JSON.stringify(json, null, 2))
// })



//RECRUSIVE MASS EDITOR (be careful, there is no undo lol)
//const path = '../../BP/items/'
// function recrute(path) {
//     fs.readdirSync(path).forEach(file => {
//         if (fs.lstatSync(path + file).isDirectory()) recrute(path + file + '/')
//         else {
//             const json = JSON.parse(strip_json(fs.readFileSync(path + file, { encoding: 'utf8' })))
//             //{
//             let icon = json["minecraft:item"].components["minecraft:icon"]
//             icon = typeof icon == 'string' ? icon : icon.texture
//             console.log(icon)
//             //}
//             //fs.writeFileSync(path + file, JSON.stringify(json, null, 2))
//         } 
//     })
// }
// recrute(path)