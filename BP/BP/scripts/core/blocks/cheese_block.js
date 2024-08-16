import {world, BlockPermutation} from "@minecraft/server";

const air = BlockPermutation.resolve("minecraft:air")

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent("cosmos:cheese_block", {
        onPlayerInteract({player, block, dimension}) {
            if(['creative', 'spectator'].includes(player.getGameMode()) || !block) return
	    const cheese = block.permutation
	    const size = cheese.getState('cosmos:cheese_part_visibility')
            block.setPermutation(size > 0 ? cheese.withState('cosmos:cheese_part_visibility', size - 1) : air)
            player.addEffect("saturation", 1, {amplifier: 1, showParticles: false})
            dimension.playSound("random.burp", player.location)
        }
    })
})
