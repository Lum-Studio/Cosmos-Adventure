const fs = require('node:fs')
const { recipes, keys } = require("./data.js")

function generate(recipe, id) {
    const content = {"format_version": "1.20.10"}
    const name = recipe.name || id.split(':').pop()

    const recipe_type = 'shape' in recipe ? "minecraft:recipe_shaped" : "minecraft:recipe_shapeless"

    const key = recipe.key
    Object.keys(key).forEach(item => {
        if (!key[item].includes(":")) key[item] = keys[key[item]]
    })
    const ingredients = recipe.items ? recipe.items.map(item => 
        Object.create({}).name = key[item]
    ) : undefined

    content[recipe_type] = { 
        description: { identifier: `cosmos:${name}` },
        tags: ["crafting_table"],
        pattern: recipe.shape,
        key: recipe.shape ? key : undefined,
        ingredients: ingredients,
        unlock: [{item:  Object.values(key)[0]}],
        result: {
            item: id,
            count: recipe.amount
        }
    }
    fs.writeFileSync(`../../BP/recipes/auto_made/${name}.json`, JSON.stringify(content, null, 2), {flag: 'w'}) 
}

for (const id of Object.keys(recipes)) {
    const recipe = recipes[id]
    if ( Array.isArray(recipe)) recipe.forEach(one => generate(one, id))
    else generate(recipe, id)
}

    //canceled because js data structures suck!
    // if ('names' in recipe) {
    //     for (let i=0; i<recipe.names.length; i++) {
    //         const name = recipe.names[i]
    //         for (const key of Object.keys(recipe.key)) {
    //             const item = recipe.key[key]
    //             if (typeof item == 'object') recipe.key[key] = recipe.key[key][i]
    //             if (!item.includes(':')) recipe.key[key] = keys[key]
    //         }
    //         console.log(Object.values(recipe.key))
    //         content[recipe_type] = { 
    //             description: { identifier: `cosmos:${name}` },
    //             tag: ["crafting_table"],
    //             pattern: recipe.shape,
    //             key: recipe.shape ? recipe.key : undefined,
    //             ingredients: recipe.items ? [] : undefined,
    //             unlock: [{item: Object.values(recipe.key)[0]}],
    //             result: {
    //                 item: id,
    //                 amount: recipe.amount
    //             }
    //         }
    //         fs.writeFileSync(`recipes/${name}.json`, JSON.stringify(content, null, 2), {flag: 'w'}) 
    //     }; continue
    // }


