import { world, system, player,  BlockPermutation, Player, Vector, Dimension } from "@minecraft/server"
import { Vec3 } from "../../api/libraries/Vector";
function grab_player() {
    const players = world.getPlayers(); // Get all players
    const entities = world.getEntity(); // Get all entities

    // Apply knockback to each player
    players.forEach(player => {
        player.applyKnockback(0, 0, 0, 0.1); // Apply knockback to the player
    });

    // Apply impulse to each entity
    entities.forEach(entity => {
        if (!entity.isPlayer) { // Check if the entity is not a player
            const vector = new Vec3(0, 0.1, 0); // Define a vector for impulse
            entity.applyImpulse(vector); // Apply impulse to the entity
        }
    });
}

function poison_player() {
    const players = world.getEntity();
    e.forEach(e => {
        e.addEffect("minecraft:poison",2);
    })
}

class VineGrowth


world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('cosmos:cavernous_vine', {
        onTick({ block }) {
            
        },
        onRandomTick({ block }) {
            
        }
    });
});