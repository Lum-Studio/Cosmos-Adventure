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
    ]
}

function tick(workbench) {
    const inventory = workbench.getComponent("minecraft:inventory").container
    const recipe_slots = []
    for (let i = 0; i<50; i++) {
        recipe_slots.push(inventory.getItem(i)?.typeId)
    }
    let output
    for (const recipe of Object.keys(recipes)) {
        output = recipe
        for (const [index, item] of recipes[recipe].entries()) {
            if (!item) continue
            if (recipe_slots[index] != item) output = undefined
        }
    }
    const spacecraft = output ? new ItemStack(output) : undefined

    const chests = [56, 57, 58].map(i => inventory.getItem(i)?.typeId == "minecraft:chest" ? 18 : 0)
    const space = chests[0] + chests[1] + chests[2]
    if (spacecraft && space) spacecraft.setLore([`§r§7Storage Space: ${space}`])
    if (spacecraft) spacecraft.setDynamicProperty("workbench_id", workbench.id)
    inventory.setItem(59, spacecraft)
}

system.afterEvents.scriptEventReceive.subscribe(({id, sourceEntity:workbench, message}) => {
    if (id != "cosmos:nasa_workbench") return
    if (message == "tick" ) {
        tick(workbench)
    }
    if (message == "despawn" ) {
        const inventory = workbench.getComponent("minecraft:inventory").container
        for (let i = 0; i < inventory.size; i++) {
            if (inventory.getItem(i)?.typeId == "cosmos:ui") inventory.setItem(i)
        }
        inventory.setItem(59)
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