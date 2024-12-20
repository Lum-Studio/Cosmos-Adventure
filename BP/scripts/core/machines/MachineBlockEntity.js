export class MachineBlockEntity {
    /**
     * @param {import('@minecraft/server').Block} block 
     * @param {import('@minecraft/server').Entity} entity
     */
    constructor(block, entity) {
        this.block = block;
        this.entity = entity;
        this.typeId = entity.typeId.replace('cosmos:machine:', '')
    }
}