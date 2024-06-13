import { MachineInstances } from "./MachineInstances";

export class MachineBlockEntity {
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
        try { // i use try in case the entity doesn't exist anymore (because this.entity will return an Entity for some reason)
            this.entity.runCommand('kill @s')  //we kill the entity to drop its inventory.
            this.entity.remove()
        } catch (error) {null}
    }
}