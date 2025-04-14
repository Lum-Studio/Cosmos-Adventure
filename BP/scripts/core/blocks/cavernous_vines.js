
import * as mc from "@minecraft/server";
import { destroyBlocks } from "api/utils";


const { world, system, TicksPerSecond } = mc;
const typeId = "cosmos:cavernous_vines";

class Vine extends Array {
    /**@param {mc.Block[] | undefined} blocks  */
    constructor() {
        super(...arguments);
    }
    #root;
    push(...blocks) {
        this.#root ??= blocks[0]?.typeId;
        return super.push(...blocks)
    }
    cut(y) {
        let blocksToBreak;
        if (typeof y === "number") {
            blocksToBreak = this.splice(this[0].y - y + 1);
            this.length--;
        }
        system.runJob(destroyBlocks(blocksToBreak ?? this, this[0].dimension))
    }
    /**@returns {mc.Block} */
    root() {
        const rootBlock = this[0].above();
        return (this.#root == rootBlock.typeId) ? rootBlock : undefined;
    }
    /**@returns {mc.Block} */
    top() { return this[0] }
    /**@returns {mc.Block} */
    bottom() { return this[this.length - 1] }
}

class CavernousVine {
    /**
     * Register the Block and all its logics only once
     * ```js
     * CavernousVine.onRegisterBlock()
     * ```
     */
    static onRegisterBlock() {
        // this [isRegistered] is just to subscribe the event only once - (M9)
        this['isRegistered'] ??= !!world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {

            blockComponentRegistry.registerCustomComponent(typeId, {
                onPlace({ block }) {
                    CavernousVine.get(block).add(block);
                },
                onTick({ block }) {
                    const cavernVines = CavernousVine.get(block);
                    if (!cavernVines || cavernVines.isBusy) return;
                    cavernVines.grabEntities();
                    cavernVines.update();
                },
                onRandomTick({ block }) {
                    CavernousVine.get(block).vineGrowth();
                }
            })
        })
    }

    /** @type {Map<string,CavernousVine>} */
    static #vineLocations = new Map();

    /**
     * @param {mc.Block} block
     * @returns {CavernousVine}
     **/
    static get(block) {
        if (block.typeId !== typeId) return;
        const key_dimXZ = `${block.dimension.id},${block.x},${block.z}`;
        let cavernVines = this.#vineLocations.get(key_dimXZ);
        return cavernVines ?? this.#vineLocations.set(key_dimXZ, new CavernousVine(block, key_dimXZ)).get(key_dimXZ);
    }

    /**
     * @param {mc.Block} block
     * @returns {mc.Block[] | undefined}
     **/
    static getVine(block) {
        if (block.typeId !== typeId) return;
        for (const vine of this.get(block).#vines) {
            if (vine.top().y >= block.y && block.y >= vine.bottom().y) return vine;
        }
    }

    /**
     * @private
     * @param {mc.Block} sourceBlock 
     * @param {string} key_dimXZ `${block.dimension.id},${block.x},${block.z}`
     **/
    constructor(sourceBlock, key_dimXZ) {
        const dim = this.dimension = sourceBlock.dimension;
        let index = dim.heightRange.max - Math.abs(dim.heightRange.min) - 1;
        let indexBlock = dim.getBlock({ ...sourceBlock, y: dim.heightRange.max - 1 });
        for (let vine = new Vine(); index--; indexBlock = indexBlock.below()) {
            if (indexBlock.typeId !== typeId) {
                if (vine.length) {
                    this.#vines.add(vine);
                    vine = new Vine();
                }
                continue;
            }
            vine.push(indexBlock)

        }
        this.vineLocations_key = key_dimXZ;
    }

    /**@type {Set<Vine>} */
    #vines = new Set();
    #isUpdating = false;
    #isGrabbingEntities = false;
    get isBusy() { return this.#isUpdating }


    *getEntities() {
        const dim = this.dimension;
        const query = { volume: { x: 0, y: 0, z: 0 } };
        for (const vine of this.#vines) {
            query.volume.y = vine.length - 1;
            query.location = vine.bottom();
            for (const entity of dim.getEntities(query)) {
                if (!entity.hasComponent("movement")) continue;
                yield entity;
            }
        }
    }

    /**
     * Grabs entities upward and overrides their gravity.
     */
    grabEntities() {
        if (this.#isGrabbingEntities) return;
        this.#isGrabbingEntities = true;
        try {
            const vector = { x: 0, y: 0.1, z: 0 };
            const tick20 = system.currentTick % 20 == 0;
            for (const entity of this.getEntities()) {

                // Temporarily override gravity
                const originalGravity = entity.getDynamicProperty("originalGravity");
                if (originalGravity === undefined) {
                    // Store the original gravity value
                    entity.setDynamicProperty("originalGravity", entity.getDynamicProperty("sert:gravity") ?? 9.8);
                }
                entity.setDynamicProperty("sert:gravity", 0); // Set gravity to 0
                // Apply upward impulse
                if (entity.typeId === "minecraft:player") {
                    entity.applyKnockback(0, 0, 0, vector.y);
                } else {
                    entity.clearVelocity(); // Clear velocity to avoid incrementing velocity
                    entity.applyImpulse(vector); // Apply impulse to the entity
                }

                // Apply poison effect every second
                if (entity.hasComponent("health") && tick20) this.applyPoison(entity);
            }
        } catch (error) { console.error(error, error?.stack) }
        this.#isGrabbingEntities = false;
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
     * @param {mc.Entity} entity
     */
    applyPoison(entity) {
        entity.addEffect("minecraft:poison", TicksPerSecond * 2); // Apply poison effect for 2 seconds
    }

    add(block) {
        for (const vine of this.#vines) {
            if (block.y === vine.bottom()?.y - 1) {
                vine.push(block);
                return;
            } else if (vine.length === 0) {
                vine.push(block);
                vine.root().typeId = block.above().typeId;
            }
        };
        this.#vines.add(new Vine(block))
    }

    async update() {
        if (this.#isUpdating) return;
        this.#isUpdating = true;
        vineLabel:
        for (const vine of this.#vines) {
            if (vine.length && vine.root()?.typeId !== vine.top()?.above()?.typeId) {
                await vine.cut();
                continue;
            }
            for (const block of vine) {
                if (block.typeId !== typeId) {
                    await vine.cut(block.y);
                    continue vineLabel;
                }
            }
        }
        this.#isUpdating = false;
    }

    /**
     * Handles vine growth logic.
     */
    vineGrowth() {
        if (this.#isUpdating) return;
        const { random, sqrt } = Math;
        for (const vine of this.#vines) {
            if (random() < sqrt(vine.length / 200)) return
            const lowerBlock = vine.bottom()?.below();
            if (lowerBlock?.typeId === "minecraft:air") {
                lowerBlock.setType(typeId);
                vine.push(lowerBlock);
            }
        }


    }
}


CavernousVine.onRegisterBlock();

export default CavernousVine;