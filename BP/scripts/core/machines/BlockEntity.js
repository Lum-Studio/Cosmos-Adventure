import { Entity, system, world } from "@minecraft/server";

class BlockEntity {
  position;
  runId;
  constructor(block, entity) {
    BlockEntityData.className[entity] = this;
    this.position = entity.location;
    this.tick = this.runId = system.runInterval(() => {
      if (!this.entity.isValid()) { 
        this.destroy();
        system.clearRun(this.runId);
        return;
      };
      return this.tick();
    });
  }
  onLoad() {}
  onInit() {}
  onTick() {}
  onPlace() {}
  onDestroy() {}
  destroy() {
    const BlockEntitySelf = BlockEntityData.getByCoords(this.position);
    BlockEntitySelf?.destroy();
    BlockEntityData.list.delete(this.position);
  }
}

class BlockEntityData {
  static className = {};
  static list = new Map();
  /**
   *
   * @param {Entity} entity
   */
  static defineEntity(entity) {
    const id = entity.typeId;
    if (!id.startsWith("cosmos:machine:")) {
      return false;
    }
    return id.replace("cosmos:machine:", "");
  }
  /**
   *
   * @param {Vector3} coords
   */
  static getByCoords(coords) {
    if (!this.list.has(coords)) return null;
    return this.list.get(coords);
  }
  static compelete = (() => {
    world.afterEvents.entitySpawn.subscribe((descriptor) => {
      const entity = descriptor.entity;
      const block = entity.dimension.getBlock(entity.location);
      const machineEntity = this.defineEntity(entity);
      if (machineEntity) {
        const BlockEntity = this.className[machineEntity];
        this.list.set(
          block.location,
          new BlockEntity(
            Object.assign(entity, { location: block.location }),
            `cosmos:${block}`
          )
        );
        const result = this.getByCoords(block.location);
        result?.init();
      }
    });

    world.afterEvents.playerBreakBlock.subscribe((descriptor) => {
      const coords = descriptor.block.location;
      const BlockEntity = this.getByCoords(coords);
      if (BlockEntity) {
        BlockEntity?.destroy();
        this.list.delete(coords);
      }
    });
  })();
}
