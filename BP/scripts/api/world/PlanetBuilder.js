
import { world, BlockVolume } from "@minecraft/server"


function chunk_corner({ x, z }) {
    return {
        x: Math.floor(x / 16) * 16,
        z: Math.floor(z / 16) * 16,
    }
}

//this removes the small end islands, shulkers, gateways and chorus plants
world.beforeEvents.worldInitialize.subscribe(eventData => {
    eventData.blockComponentRegistry.registerCustomComponent('cosmos:end_cleaner', {
        onPlace({ block, dimension, previousBlock }) {
            const { x, z } = chunk_corner(block);
            if (!dimension.id.endsWith("the_end") || Math.abs(x) <= 1e4 || Math.abs(z) <= 1e4) {
                block.setPermutation(previousBlock);
                throw new RangeError(`§cBlock 'cosmos:end_cleaner' is only allowed further than 10,000 in the_end!§r`);
            }
            const first_corner = { x, y: 10, z }
            const other_corner = { x: x + 15, y: 120, z: z + 15 }
            dimension.fillBlocks(new BlockVolume(first_corner, other_corner), 'air', {
                blockFilter: { includeTypes: ['end_stone', 'bedrock', 'end_gateway', 'chorus_plant', 'chorus_flower'] }
            })
            block.setPermutation(previousBlock)
            const shulkers = dimension.getEntities({
                location: first_corner,
                volume: { x: 16, y: 210, z: 16 },
                type: "minecraft:shulker",
            })
            shulkers.forEach(shulker => shulker.remove())
        }
    })
})