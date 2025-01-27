
import { world, system, TicksPerSecond, Block, Entity } from "@minecraft/server";
import { Vec3 } from "../../api/libraries/Vector";

class CavernousVine {
    /**
     * Register the Block and all its logics only once
     * ```js
     * CavernousVine.onRegisterBlock()
     * ```
     */
    static onRegisterBlock() {
        world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
            blockComponentRegistry.registerCustomComponent("cosmos:cavernous_vines", {
                onTick({ block }) {
                    const cavernousVine = CavernousVine.get(block);
                    cavernousVine.grabEntities();
                },
                onRandomTick({ block }) {
                    const cavernousVine = CavernousVine.get(block);
                    cavernousVine.vineGrowth();
                }
            });
        });
    };

    /** @type {Map<string,{[y:number]:CavernousVine}>} */
    static vineLocations = new Map();

    /**
     * @param {Block} block
     * @returns {CavernousVine}
     **/
    static get(block) {
        let key = `${block.x},${block.z}`;
        let vines = this.vineLocations.get(key);
        if (!vines) {
            vines = this.vineLocations.set(key, {}).get(key);
        }
        return vines[block.y] ??= new CavernousVine(block, key);
    }


    /**
     * @private
     * @param {Block} block
     **/
    constructor(block, key) {
        this.block = block;
        this.dimension = block.dimension;
        this.getEntities = () => block.dimension.getEntitiesAtBlockLocation(block);
        this.vineLocations_key = key;
    }

    grabEntities() {

        // Apply impulse to each entity
        for (const entity of this.getEntities()) {
            if (!entity.hasComponent("movement")) continue;
            if (entity.typeId === "minecraft:player") {
                entity.applyKnockback(0, 0, 0, 0.5);
            } else {
                const vector = new Vec3(0, 0.5, 0); // Define a vector for impulse
                entity.applyImpulse(vector); // Apply impulse to the entity
            };
            if (system.currentTick % 20 == 0) this.applyPoison(entity)
        }
    }
    /**
     * @param {Entity} entity 
     */
    applyPoison(entity) {
        entity.addEffect("minecraft:poison", TicksPerSecond * 2); // Apply poison effect for 2 seconds
    }

    vineGrowth() {
        const block = this.block;
        if (block.dimension.heightRange.min == block.y) return

        if (block.below()?.typeId == "minecraft:air") {
            block.below().setType(block.typeId)
        }
    }
};

CavernousVine.onRegisterBlock()

export default CavernousVine;
