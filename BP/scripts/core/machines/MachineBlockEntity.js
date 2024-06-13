import { MachineInstances } from "./MachineInstances";

export class MachineBlockEntity {
    /**
     * @param {import('@minecraft/server').Block} block 
     * @param {import('@minecraft/server').Entity} entity
     */
    constructor(block, entity) {
        this.block = block;
        this.entity = entity;
        this.tier = 0;
    }
    destroy() {
        MachineInstances.destroy(this.block.dimension, this.block.location);
        const container = this.entity.getComponent('minecraft:inventory')?.container
        if (container) {
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                container.setItem(i, undefined)
                if (item?.typeId == 'cosmos:ui') continue;
                this.block.dimension.spawnItem(item, this.block.location).clearVelocity();
            }
        }
        try {
            this.entity.remove();
            // Since this.entity somehow still returns a reference to a not existing entity, set the property to null after removing the entity
            this.entity = null;
        } catch (error) { }
    }
}