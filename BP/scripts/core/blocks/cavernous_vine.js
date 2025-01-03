import { world, system, player,  BlockPermutation, Player, Vector, Dimension } from "@minecraft/server"
import { Vec3 } from "../../api/libraries/Vector";

class CavernousVine {
    constructor(world) {
        this.world = world; 
    }

    grabPlayer() {
        const players = this.world.getPlayers(); // Get all players
        const entities = this.world.getEntities(); // Get all entities
        players.forEach(player => {
            player.applyKnockback(0, 0, 0, 0.1); // Apply knockback to the player
        });
    poisonPlayer() {
        const players = this.world.getPlayers(); // Get all players
        players.forEach(player => {
            player.addEffect("minecraft:poison", 2); // Apply poison effect for 2 seconds
        });
    }
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