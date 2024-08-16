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
                if (container.getItem(i)?.typeId == 'cosmos:ui') {
                    container.setItem(i, undefined)
                }
            }
        }
        try {
            this.entity.runCommand('kill @s')
            this.entity.remove()
        } catch (error) {null}
    }
}