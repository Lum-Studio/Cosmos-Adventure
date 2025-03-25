import { world, system, BlockPermutation } from "@minecraft/server";
import machines from "./AllMachineBlocks";
import { detach_wires, attach_to_wires } from "../blocks/aluminum_wire";
import { pickaxes } from "../../api/utils";

export let machine_entities = new Map();

/**
 * Moves items into a block or entity container from nearby hoppers
 * @param {Block | Entity} object - The block or entity to which items need to be moved.
 * @param {Function<ItemStack>} itemFilter - A function that takes an ItemStack object and returns true or false depending on whether the item can be moved. (optional)
 * @returns {Boolean} - True if the process was executed, false otherwise.
 */
function moveItemsFromHoppers(object, itemFilter) {
  const center = object.dimension.getBlock(object.location);
  const inv = object.getComponent('inventory')?.container;
  if (center == undefined || inv == undefined) return false;

  const offsets = [{ x: 1 }, { x: -1 }, { z: 1 }, { z: -1 }, { y: 1 }].map(offset => { 
    return { x: offset.x || 0, y: offset.y || 0, z: offset.z || 0 };
  });

  for (let offset of offsets) {
    const block = center.offset(offset);
    if (block == undefined || block.typeId != 'minecraft:hopper' || block.permutation.getState('toggle_bit')) continue;
      
    let offsetTo = {
      '2': { z: 1, y: 0, x: 0 },
      '3': { z: -1, y: 0, x: 0 },
      '4': { x: 1, y: 0, z: 0 },
      '5': { x: -1, y: 0, z: 0 },
      '0': { x: 0, y: 1, z: 0 }
    }[block.permutation.getState('facing_direction')] || { x: 0, y: 0, z: 0 };
    if (!['x', 'y', 'z'].every(axis => offsetTo[axis] == offset[axis])) continue;
      
    const blockInv = block.getComponent('inventory')?.container;
    if (!blockInv) continue;
    for (let i = 0; i < blockInv.size; i++) {
      let item = blockInv.getItem(i);
      if (item == undefined || (itemFilter != undefined && !itemFilter(item))) continue;
      blockInv.setItem(i, blockInv.transferItem(i, inv));
    }
  }
  return true;
}

function clean_machine_entities(machinesMap) {
  for (const [entityId, machineData] of machinesMap.entries()) {
    const entity = world.getEntity(entityId);
    if (!entity) continue;
    const block = entity.dimension.getBlock(machineData.location);
    if (!block) continue;
    new machines[machineData.type].class(entity, block);
  }
}

function block_entity_access() {
  const players = world.getAllPlayers();
  for (const player of players) {
    if (!player) continue;
    const targetEntity = player.getEntitiesFromViewDirection({ maxDistance: 6, families: ["cosmos"] })[0]?.entity;
    if (player.isSneaking) {
      if (targetEntity) targetEntity.triggerEvent("cosmos:shrink");
      continue;
    }
    const item = player.getComponent("minecraft:equippable").getEquipment("Mainhand")?.typeId;
    const has_pickaxe = pickaxes.has(item);
    const has_wrench = item === "cosmos:standard_wrench";
    if (has_pickaxe || has_wrench) {
      if (targetEntity) targetEntity.triggerEvent("cosmos:shrink");
    }
  }
}


system.runInterval(() => {
  if (machine_entities.size === 0) return;
  if (system.currentTick % 2 === 0) block_entity_access();
  clean_machine_entities(machine_entities);
  machine_entities.forEach((machineData, entityId) => {
    const machineEntity = world.getEntity(entityId);
    if (machineEntity) {
      moveItemsFromHoppers(machineEntity, undefined);
    }
  });
}, 1);



world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent('cosmos:machine', {
    beforeOnPlayerPlace(event) {
      const { block, permutationToPlace: perm } = event;
      const machine_name = perm.type.id.replace('cosmos:', '');
      const machine_object = machines[machine_name];
      const machineEntity = block.dimension.spawnEntity(perm.type.id, block.bottomCenter());
      machineEntity.nameTag = machine_object.ui;
      new machine_object.class(machineEntity, block).onPlace();
      machine_entities.set(machineEntity.id, { type: machine_name, location: block.location });
      if (perm.getState("cosmos:full")) {
        event.permutationToPlace = perm.withState("cosmos:full", false);
      }
      system.run(() => attach_to_wires(block));
    },
    onPlayerDestroy({ block, dimension, destroyedBlockPermutation: perm }) {
      detach_wires(block);
      const machineEntity = dimension.getEntities({
        type: perm.type.id,
        location: {
          x: Math.floor(block.location.x) + 0.5,
          y: Math.floor(block.location.y) + 0.5,
          z: Math.floor(block.location.z) + 0.5,
        },
        maxDistance: 0.5,
      })[0];
      if (!machineEntity) return;
      machine_entities.delete(machineEntity.id);
      const container = machineEntity.getComponent('minecraft:inventory')?.container;
      if (container) {
        for (let i = 0; i < container.size; i++) {
          const itemId = container.getItem(i)?.typeId;
          if (!['cosmos:ui', 'cosmos:ui_button'].includes(itemId)) continue;
          container.setItem(i);
        }
      }
      machineEntity.runCommand('kill @s');
      machineEntity.remove();
    },
  });
});

world.afterEvents.entityLoad.subscribe(({ entity }) => {
  const machine_name = entity.typeId.replace('cosmos:', '');
  if (!Object.keys(machines).includes(machine_name)) return;
  if (machine_entities.has(entity.id)) return;
  const block = entity.dimension.getBlock(entity.location);
  if (block.typeId != entity.typeId) {
    machine_entities.delete(entity.id);
    entity.remove();
    return;
  }
  new machines[machine_name].class(entity, block);
  machine_entities.set(entity.id, { type: machine_name, location: block.location });
});

world.afterEvents.worldInitialize.subscribe(() => {
  world.getDims(dimension => dimension.getEntities()).forEach(entity => {
    const machine_name = entity.typeId.replace('cosmos:', '');
    if (!Object.keys(machines).includes(machine_name)) return;
    const block = entity.dimension.getBlock(entity.location);
    if (block.typeId != entity.typeId) {
      machine_entities.delete(entity.id);
      entity.remove();
      return;
    }
    new machines[machine_name].class(entity, block);
    machine_entities.set(entity.id, { type: machine_name, location: block.location });
  });
});



world.beforeEvents.playerInteractWithEntity.subscribe((e) => {
  const { target: entity, player } = e;
  if (!machine_entities.has(entity.id)) return;
  if (!player.isSneaking) return;
  
  e.cancel = true;
  const equipment = player.getComponent("equippable");
  const selectedItem = equipment.getEquipment("Mainhand");
  if (!selectedItem) return;
  
  if (selectedItem.typeId === "minecraft:hopper") {
    const machineBlock = player.dimension.getBlock(entity.location);
    if (machineBlock) {
      const facingDirection = (() => {
        const dx = player.location.x - entity.location.x;
        const dz = player.location.z - entity.location.z;
        if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? 1 : 3;
        else return dz > 0 ? 2 : 0;
      })();
      const getAdjacentBlockLocation = (location, facingDirection) => {
        switch (facingDirection) {
          case 0: return { x: location.x, y: location.y, z: location.z - 1 };
          case 1: return { x: location.x + 1, y: location.y, z: location.z };
          case 2: return { x: location.x, y: location.y, z: location.z + 1 };
          case 3: return { x: location.x - 1, y: location.y, z: location.z };
          default: return location;
        }
      };
      
      const hopperLocation = getAdjacentBlockLocation(machineBlock.location, facingDirection);
      const hopperBlock = player.dimension.getBlock(hopperLocation);
      
      const hasEntitiesAt = (dimension, location) => {
        const entities = dimension.getEntities({
          location: { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 },
          maxDistance: 0.5,
        });
        return entities.length > 0;
      };
      
      if (hopperBlock.typeId === "minecraft:air" && !hasEntitiesAt(player.dimension, hopperLocation)) {
        const hopperPermutation = BlockPermutation.resolve("minecraft:hopper")
          .withState("facing_direction", facingDirection);
        
        system.run(() => {
          hopperBlock.setPermutation(hopperPermutation);
          if (player.getGameMode() !== "creative") {
            if (selectedItem.amount === 1) {
              equipment.setEquipment("Mainhand", undefined);
            } else {
              selectedItem.amount -= 1;
              equipment.setEquipment("Mainhand", selectedItem);
            }
          }
        });
      }
    }
  }
});
