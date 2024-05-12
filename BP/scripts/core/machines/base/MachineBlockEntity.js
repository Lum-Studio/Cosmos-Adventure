import { MachineInstances } from "../MachineInstances";

export class MachineBlockEntity {
    constructor(block,entity){
        this.block = block;
        this.entity = entity;
        this.tier = 0;
    }
    destroy() {
        MachineInstances.delete(this.block.dimension, this.block.location);
        this.entity.remove();
        this.block.dimension.runCommandAsync(`setblock ${this.block.location.x} ${this.block.location.y} ${this.block.location.z} air destroy`);
    }
}