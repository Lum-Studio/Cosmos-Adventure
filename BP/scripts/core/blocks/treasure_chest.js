import { world } from "@minecraft/server"
const tiers = {
    "cosmos:tier1_key": "cosmos:tier1_treasure_chest",
    "cosmos:tier2_key": "cosmos:tier2_treasure_chest",
    "cosmos:tier3_key": "cosmos:tier3_treasure_chest",
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('cosmos:treasure_chest', {
        onPlayerInteract({block, player, dimension}) {
            const chest = block.permutation
            const equipment = player.getComponent("minecraft:equippable")
            const item = equipment.getEquipment("Mainhand")
            if (chest.getState('cosmos:chest_state') != 'locked') return
            if (tiers[item?.typeId] != block.typeId) return
            const tier = Object.keys(tiers).indexOf(item.typeId) + 1
            world.structureManager.place(`treasures/tier${tier}`, dimension, block.location)
            block.setPermutation(chest.withState('cosmos:chest_state', 'unlocked'))
            if (player.getGameMode() != 'creative') player.runCommand(`clear @s ${item.typeId} 0 1`)
        }
    })
})

world.afterEvents.playerInteractWithEntity.subscribe(({target:entity})=> {
    if (entity.typeId != "cosmos:treasure_chest") return
    const chest = entity.dimension.getBlock(entity.location)
    if (!Object.values(tiers).includes(chest.typeId)) return
    chest.setPermutation(chest.permutation.withState('cosmos:chest_state', 'open'))
})

world.afterEvents.entityHitEntity.subscribe(({damagingEntity:player, hitEntity:entity})=> {
    if (player.typeId != "minecraft:player") return
    if (entity.typeId != "cosmos:treasure_chest") return
    if (player.getGameMode() != 'creative') return
    entity.runCommand(`setblock ~~~ air destroy`)
    entity.kill(); entity.remove()
})