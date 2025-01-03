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
    vineGrowth() ;{
        let block = e.block
        if (block.dimension.heightRange.min == block.y) return
      
        if (block.below()?.typeId == 'minecraft:air') {
          block.below().setType(block.typeId == 'cosmos:cavernous_vine')
        }
      }
//Register the Block and all its logics
      onRegisterBlock() ;{
        world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
            blockComponentRegistry.registerCustomComponent('cosmos:cavernous_vine', {
                onTick({ block }) {
                    const cavernousVine = new CavernousVine();
                    cavernousVine.grabPlayer(block);
                    cavernousVine.poisonPlayer(block);
                },
                onRandomTick({ block }) {
                    const cavernousVine = new CavernousVine(); 
                    cavernousVine.vineGrowth(block);
                }
            });
        });
    }


export default CavernousVine;
    