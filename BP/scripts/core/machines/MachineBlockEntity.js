import { MachineInstances } from "./MachineInstances";

export class MachineBlockEntity {
    constructor(block, entity) {
        this.block = block;
        this.entity = entity;
        this.tier = 0;
    }
    destroy() {
        MachineInstances.delete(this.block.dimension, this.block.location);
        const container = this.entity.getComponent('minecraft:inventory').container
        for (let i = 0; i < container.size; i++) {
            if (container.getItem(i)?.typeId == 'cosmos:ui') {
                container.setItem(i, undefined)
            }
        }
        this.entity.remove();
        this.block.dimension.runCommandAsync(`setblock ${this.block.location.x} ${this.block.location.y} ${this.block.location.z} air destroy`);
    }
}