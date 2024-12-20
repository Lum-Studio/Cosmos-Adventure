import { world, system, BlockPermutation } from "@minecraft/server"
import {}
function grab_player

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