import { world, ItemStack, system } from "@minecraft/server"


/* SLOT DEBUGGER
world.afterEvents.playerInteractWithEntity.subscribe(({target}) => {
	const container = target.getComponent("minecraft:inventory").container
    const slotItem = new ItemStack("cosmos:ui")
    for (let i = 0; i < container.size; i++) {
        slotItem.nameTag = '§r§u' + ( i + 1 )
        container.setItem(i, slotItem)
    }
}) */

const recipes = {
    "cosmos:rocket_tier_1_item": [
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:rocket_engine",
        "cosmos:nose_cone",
    ], //14 items
    "cosmos:rocket_tier_2_item": [
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:tier_1_booster",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:tier_1_booster",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:rocket_engine",
        "cosmos:nose_cone",
    ], //18 items
    "cosmos:rocket_tier_3_item": [
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:heavy_duty_plate_tier3",
        "cosmos:tier_1_booster",
        "cosmos:heavy_rocket_fins",
        "cosmos:heavy_rocket_fins",
        "cosmos:tier_1_booster",
        "cosmos:heavy_rocket_fins",
        "cosmos:heavy_rocket_fins",
        "cosmos:heavy_rocket_engine",
        "cosmos:heavy_nose_cone",
    ], //18 items
    "cosmos:buggy": [
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:buggy_seat",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:heavy_duty_plate",
        "cosmos:buggy_wheel",
        "cosmos:buggy_wheel",
        "cosmos:buggy_wheel",
        "cosmos:buggy_wheel",
    ], //14 items
    "cosmos:cargo_rocket": [
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:heavy_duty_plate_tier2",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:rocket_fins",
        "cosmos:nose_cone",
        "cosmos:advanced_wafer",
        "cosmos:rocket_engine",
    ], //13 items
    "cosmos:astro_miner": [
        "cosmos:heavy_duty_plate",
        "cosmos:orion_drive",
        "cosmos:heavy_duty_plate",
        "cosmos:orion_drive",

        "cosmos:heavy_duty_plate",
        "cosmos:advanced_wafer",
        "minecraft:chest",
        "minecraft:chest",
        "cosmos:orion_drive",

        "cosmos:orion_drive",
        "cosmos:heavy_duty_plate",
        "cosmos:orion_drive",

        "cosmos:beam_core",
        "cosmos:steel_pole",
    ]//14 items
}

const schematics = {
    'cosmos:schematic_rocket_t2': 'cosmos:rocket_tier_2_item',
    'cosmos:schematic_rocket_t3': 'cosmos:rocket_tier_3_item',
    'cosmos:schematic_buggy': 'cosmos:buggy',
    'cosmos:schematic_cargo_rocket': 'cosmos:cargo_rocket',
    'cosmos:schematic_astro_miner': 'cosmos:astro_miner',
}

const MAXSIZE = 18
const BUTTONS = MAXSIZE + 5
const SCHEMA = BUTTONS + 6
const SCHEMAS = SCHEMA + 2

function select_recipe(recipe, workbench, player) {
    workbench.setDynamicProperty('recipe', recipe)
    const inventory = workbench.getComponent("minecraft:inventory").container
    for (let i = 0; i < MAXSIZE; i++) {
        const item = inventory.getItem(i)
        if (player && item && item.typeId != 'cosmos:ui') workbench.dimension.spawnItem(item, player.location)
        inventory.setItem(i, i < recipes[recipe].length ? undefined : new ItemStack('cosmos:ui'))
    }
}

function tick(workbench) {
    // retrive data
    const inventory = workbench.getComponent("minecraft:inventory").container
    const selected_recipe = workbench.getDynamicProperty('recipe')
    const nearest_player = workbench.dimension.getPlayers({closest: 1, location: workbench.location})[0]
    const recipe = recipes[selected_recipe]
    // read the inputs
    const inputs = []
    for (let i = 0; i<MAXSIZE; i++) {
        inputs.push(inventory.getItem(i)?.typeId)
    }
    // check the recipe
    let recipe_matches = true
    for (let i in recipe) {
        if (recipe[i] != inputs[i]) {
            recipe_matches = false
            break
        }
    }
    // set the storage size
    let storage_size = 0
    const storage_type = selected_recipe == 'cosmos:buggy' ? 'cosmos:buggy_storage' : 'minecraft:chest'
    if (selected_recipe != 'cosmos:astro_miner') {
        for (let i = 0; i<3; i++) {
            if (inventory.getItem(MAXSIZE + i)?.typeId == storage_type) storage_size += 18
        }
    }

    // detect craft button press
    const craft_button = inventory.getItem(MAXSIZE + 4)
    if (!craft_button) {
        // reset the button
        inventory.add_ui_button(MAXSIZE + 4)
        // consume the crafting materials
        for (let i = 0; i < recipe.length; i++) {
            inventory.setItem(i, inventory.getItem(i)?.decrementStack())
        }
        // consume the added storage
        for (let i = 0; i < 3; i++) {
            const item = inventory.getItem(MAXSIZE + i)
            if (!item || item.typeId != storage_type) continue
            inventory.setItem(MAXSIZE + i, item?.decrementStack())
        }
        // find the player who crafted
        const player = workbench.dimension.getPlayers({location: workbench.location, maxDistance: 20}).find(player => {
            const inventory = player.getComponent('inventory')
            // search for the button in his inventory
            for (let i = 0; i < inventory.inventorySize; i++) {
                const item = inventory.container.getItem(i)
                if (!item || item.typeId != 'cosmos:ui_button') continue
                const id = item.getLore()[0]
                if (!id || id != workbench.id) continue
                inventory.container.setItem(i)
                // give the rocket to the player
                player.sendMessage('I will give you your rocket later.')
            } 
        })
    }

    // change the craft button depending on the inputs
    if (recipe_matches) {
        const button_name = `§craft_button:size${storage_size}${selected_recipe}`
        if (!craft_button || craft_button.nameTag != button_name) inventory.add_ui_button(MAXSIZE + 4, button_name, [workbench.id])
    } else {
        if (!craft_button || craft_button.nameTag) inventory.add_ui_button(MAXSIZE + 4)
    }

    // get the schematic
    const schematic = inventory.getItem(MAXSIZE + 3)

    // set up the side buttons based on the inserted schematics
    const unlocked_schematics = [true]
    const schematic_names = Object.keys(schematics)
    for (const i in schematic_names) {
        unlocked_schematics[+i + 1] = inventory.getItem(SCHEMAS + +i)?.typeId == schematic_names[i]
    }

    // add the side buttons
    const button_names = ['Tier 1 Rocket', 'Tier 2 Rocket', 'Tier 3 Rocket', 'Moon Buggy', 'Cargo Rocket', 'Astro Miner']
    for (let i in button_names) {
        const side_button = inventory.getItem(BUTTONS + +i)
        if (!side_button) {
            workbench.runCommand('clear @a cosmos:ui_button')
            select_recipe(Object.keys(recipes)[i], workbench, nearest_player)
        }
        const button_name = unlocked_schematics[i] ? `§side_button:${button_names[i]}` : ''
        if (inventory.getItem(BUTTONS + +i)?.nameTag != button_name) inventory.add_ui_button(BUTTONS + +i, button_name)
    }
    inventory.add_ui_button(SCHEMA, `§side_button:Add Schematics`)

    const unlock_button = inventory.getItem(SCHEMA + 1)
    if (!unlock_button) {
        workbench.runCommand('clear @a cosmos:ui_button')
        inventory.add_ui_button(SCHEMA + 1, `§unlock_button:Unlock`)
        if (!schematic) return
        if (!schematic_names.includes(schematic.typeId)) return
        const schematic_place = schematic_names.indexOf(schematic.typeId)
        if (inventory.getItem(SCHEMAS + schematic_place)?.typeId == schematic.typeId) return
        inventory.setItem(SCHEMAS + schematic_place, schematic)
        inventory.setItem(MAXSIZE + 3)
        //select_recipe(schematics[schematic.typeId], workbench, nearest_player)
    }

    // ui_button.nameTag = `§side_button:Tier 1 Rocket`
    // inventory.setItem(MAXSIZE + 9, ui_button)
    // ui_button.nameTag = unlocked[0] ? `§side_button:Tier 2 Rocket` : ''
    // inventory.setItem(MAXSIZE + 10, ui_button)
    // ui_button.nameTag = unlocked[1] ? `§side_button:Tier 3 Rocket` : ''
    // inventory.setItem(MAXSIZE + 11, ui_button)
    // ui_button.nameTag = unlocked[2] ? `§side_button:Moon Buggy` : ''
    // inventory.setItem(MAXSIZE + 12, ui_button)
    // ui_button.nameTag = unlocked[3] ? `§side_button:Cargo Rocket` : ''
    // inventory.setItem(MAXSIZE + 13, ui_button)
    // ui_button.nameTag = unlocked[4] ? `§side_button:Astro Miner` : ''
    // inventory.setItem(MAXSIZE + 14, ui_button)
    // ui_button.nameTag = !unlocked.includes(undefined) ? `§side_button:Add Schematic` : ''
    // inventory.setItem(MAXSIZE + 15, ui_button)

    //old code
    // for (const recipe of Object.keys(recipes)) {
    //     output = recipe
    //     for (const [index, item] of recipes[recipe].entries()) {
    //         if (!item) continue
    //         if (recipe_slots[index] != item) output = undefined
    //     }
    // }
    // const spacecraft = output ? new ItemStack(output) : undefined

    // const chests = [56, 57, 58].map(i => inventory.getItem(i)?.typeId == "minecraft:chest" ? 18 : 0)
    // const space = chests[0] + chests[1] + chests[2]
    // if (spacecraft && space) spacecraft.setLore([`§r§7Storage Space: ${space}`])
    // //if (spacecraft) spacecraft.setDynamicProperty("workbench_id", workbench.id)
    // inventory.setItem(59, spacecraft)
}

system.afterEvents.scriptEventReceive.subscribe(({id, sourceEntity:workbench, message}) => {
    if (id != "cosmos:nasa_workbench") return
    if (message == "tick" ) {
        tick(workbench)
    }
    if (message == "despawn" ) {
        const inventory = workbench.getComponent("minecraft:inventory").container
        for (let i = 0; i < inventory.size; i++) {
            if (["cosmos:ui", "cosmos:ui_button"].includes(inventory.getItem(i)?.typeId)) inventory.setItem(i)
        }
        workbench.kill()
        workbench.remove()
    }
})

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent("cosmos:nasa_workbench", {
        beforeOnPlayerPlace(event){
            const {dimension, block} = event
            let space = true
            for (let i = -1; i<2; i++) {
                if (block.offset({x: i, y: 1, z: 0}).typeId != "minecraft:air") space = false
                if (block.offset({x: i, y: 2, z: 0}).typeId != "minecraft:air") space = false
            }
            for (let i = -1; i<2; i++) {
                if (block.offset({x: 0, y: 1, z: i}).typeId != "minecraft:air") space = false
                if (block.offset({x: 0, y: 2, z: i}).typeId != "minecraft:air") space = false
            }
            if (!space) { event.cancel = true; return }
            const entity = dimension.spawnEntity("cosmos:nasa_workbench", block.above().bottomCenter())
            entity.nameTag = "§n§a§s§a§_§w§o§r§k§b§e§n§c§h"
            select_recipe('cosmos:rocket_tier_1_item', entity)
            const inventory = entity.getComponent('inventory').container
            for (let i = SCHEMAS; i < SCHEMAS + 9; i++) inventory.add_ui_display(i)
            for (let i = BUTTONS - 1; i < BUTTONS + 8; i++) inventory.add_ui_button(i)
            inventory.add_ui_button(SCHEMA + 1, `§unlock_button:Unlock`)
        },
        onPlayerDestroy({block, dimension}){
            const entities = dimension.getEntities({
                type: "cosmos:nasa_workbench",
                location: block.above().center(),
                maxDistance: 0.5
            })
            entities?.forEach(entity => entity.runCommand(`scriptevent cosmos:nasa_workbench despawn`))
        }
    })
})