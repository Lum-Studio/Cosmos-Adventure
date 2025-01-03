import { world, system, player,  BlockPermutation, Player, Vector, Dimension } from "@minecraft/server"
import { Vec3 } from "../../api/libraries/Vector";

class CavernousVine {
    constructor(world) {
        this.world = world; e
    }
    grabPlayer() {
        const players = this.world.getPlayers(); // Get all players
        const entities = this.world.getEntities(); // Get all entities

        // Apply knockback to each player
        players.forEach(player => {
            player.applyKnockback(0, 0, 0, 0.1); // Apply knockback to the player
        });

        // Apply impulse to each entity
        entities.forEach(entity => {
            if (entity.typeId === 'minecraft:player') {
            } else {
                const vector = new Vec3(0, 0.1, 0); // Define a vector for impulse
                entity.applyImpulse(vector); // Apply impulse to the entity
            }
        });
    }

    poisonPlayer() {
        const players = this.world.getPlayers(); // Get all players
        players.forEach(player => {
            player.addEffect("minecraft:poison", 2); // Apply poison effect for 2 seconds
        });
    }
}

function growth

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    blockComponentRegistry.registerCustomComponent('cosmos:cavernous_vine', {
        onTick({ block }) {
            
        },
        onRandomTick({ block }) {
            
        }
    });
});