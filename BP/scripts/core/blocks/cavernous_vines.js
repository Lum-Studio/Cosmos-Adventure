
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

    /**
     * Grabs entities and overrides their gravity.
     */
    grabEntities() {
        for (const entity of this.getEntities()) {
            if (!entity.hasComponent("movement")) continue;

            // Temporarily override gravity
            const originalGravity = entity.getDynamicProperty("originalGravity");
            if (originalGravity === undefined) {
                // Store the original gravity value
                entity.setDynamicProperty("originalGravity", entity.getDynamicProperty("sert:gravity") ?? 9.8);
            }
            entity.setDynamicProperty("sert:gravity", 0); // Set gravity to 0

            // Apply upward impulse
            if (entity.typeId === "minecraft:player") {
                entity.applyKnockback(0, 0, 0, 0.1);
            } else {
                const vector = new Vec3(0, 0.1, 0); // Define a vector for impulse
                entity.applyImpulse(vector); // Apply impulse to the entity
            }

            // Apply poison effect every second
            if (system.currentTick % 20 == 0) this.applyPoison(entity);
        }
    }

    /**
     * Restores the original gravity for entities no longer grabbed by the vine.
     */
    restoreGravity() {
        for (const entity of this.getEntities()) {
            const originalGravity = entity.getDynamicProperty("originalGravity");
            if (originalGravity !== undefined) {
                // Restore the original gravity value
                entity.setDynamicProperty("sert:gravity", originalGravity);
                entity.setDynamicProperty("originalGravity", undefined); // Clear the stored value
            }
        }
    }

    /**
     * Applies poison effect to the entity.
     * @param {Entity} entity
     */
    applyPoison(entity) {
        entity.addEffect("minecraft:poison", TicksPerSecond * 200); // Apply poison effect for 2 seconds
    }

    /**
     * Handles vine growth logic.
     */
    vineGrowth() {
        const block = this.block;
        if (block.dimension.heightRange.min == block.y) return;

        if (block.below()?.typeId == "minecraft:air") {
            block.below().setType(block.typeId);
        }
    }
}

CavernousVine.onRegisterBlock();

export default CavernousVine;