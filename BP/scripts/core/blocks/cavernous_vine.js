import { world, system, player,  BlockPermutation, Player, Vector } from "@minecraft/server"
import { delay } from "../../api/utils";

function grab_player(dimension) {
    const players = dimension.getEntities(); 
    players.forEach(player => { 
        player.applyKnockback(0, 0, 0, 0.1); 
    });
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