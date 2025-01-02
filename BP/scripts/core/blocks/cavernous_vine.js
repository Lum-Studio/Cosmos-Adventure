import { world, system, player,  BlockPermutation, Player, Vector } from "@minecraft/server"
function grab_player(entity, spawn_pos) {
    const e = dimension.getEntities()
    const determinant_y = spawn_pos.y - 0.5; // Reference height
    const tickdelay = 4; // How often to apply knockback

    // This function will be called repeatedly every tick
        const player_pos = entity.location;
        const heightDelta = player_pos.y - determinant_y;

        // Check if the player should be affected
        if (
            Math.floor(spawn_pos.x) === Math.floor(player_pos.x) &&
            Math.floor(spawn_pos.z) === Math.floor(player_pos.z) &&
            heightDelta > 0 && heightDelta < 5 &&
            determinant_y + 0.2 >= dimension.getBlockFromRay(player_pos, Vector.down, { includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 15 }).block.location.y
        ) {
            // Apply continuous upward knockback
            try {
                entity.applyKnockback(0, 0, 0, 1); 
            } catch (error) {
                console.error('Error applying knockback:', error);
            }
        }
    }

}
function poison_player

class VineGrowth


world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('cosmos:cavernous_vine', {
        onTick({ block }) {
            
        },
        onRandomTick({ block }) {
            
        }
    });
});