import {world, BlockPermutation} from "@minecraft/server";

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent("cosmos:cheese_block", {
        onPlayerInteract(e){
            if(e.player.getGameMode() === 'creative' || e.player.getGameMode() === 'spectator' || !e.block) return
            if(e.block.permutation.getState('cosmos:cheese_part_visibility') > 0){
                e.block.setPermutation(e.block.permutation.withState('cosmos:cheese_part_visibility', e.block.permutation.getState('cosmos:cheese_part_visibility') - 1))
            }else if(e.block.permutation.getState('cosmos:cheese_part_visibility') === 0) e.block.setPermutation(BlockPermutation.resolve("minecraft:air"))
            e.player.addEffect("saturation", 5, {amplifier: 1, showParticles: false})
            e.dimension.playSound("random.burp", e.player.location)
        },
    });
})
