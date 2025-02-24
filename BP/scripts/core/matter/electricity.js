import { world } from "@minecraft/server";
import AllMachineBlocks from "../machines/AllMachineBlocks"
import { compare_position, floor_position } from "../../api/utils";

/**
 * Retrieves the configuration data for a given machine.
 *
 * @param {Entity} machine - The machine entity.
 * @returns {object} The machine data from the AllMachineBlocks registry.
 */
export function get_data(machine) {
  return AllMachineBlocks[machine.typeId.replace('cosmos:', '')];
}

/**
 * Converts an object to its JSON string representation.
 *
 * @param {object} object - The object to stringify.
 * @returns {string} The JSON string representation of the object.
 */
export function str(object) {
  return JSON.stringify(object);
}

/**
 * Sends a message to the world chat.
 *
 * @param {string} [message='yes'] - The message to send.
 */
export function say(message = 'yes') {
  world.sendMessage('' + message);
}

/**
 * Class representing a network of machines connected to a specific machine.
 */
export class MachinesInNetwork {
  /**
   * Creates an instance of MachinesInNetwork.
   *
   * @param {Entity} machine - The reference machine entity.
   */
  constructor(machine) {
    this.machine = machine;
  }

  /**
   * Retrieves the list of connected input machines.
   *
   * @returns {Array|undefined} An array of machine info tuples or undefined if not set.
   */
  getInputMachines() {
    const icm = this.machine.getDynamicProperty("input_connected_machines");
    try {
      return icm ? JSON.parse(icm) : undefined;
    } catch (e) {
      console.error("Error parsing input_connected_machines:", e);
      return undefined;
    }
  }

  /**
   * Retrieves the list of connected output machines.
   *
   * @returns {Array|undefined} An array of machine info tuples or undefined if not set.
   */
  getOutputMachines() {
    const ocm = this.machine.getDynamicProperty("output_connected_machines");
    try {
      return ocm ? JSON.parse(ocm) : undefined;
    } catch (e) {
      console.error("Error parsing output_connected_machines:", e);
      return undefined;
    }
  }
}

/**
 * Retrieves an entity of a specific family near a given location within a dimension.
 *
 * @param {Dimension} dimension - The dimension in which to search.
 * @param {object} location - The target location with x, y, and z properties.
 * @param {string} family - The family tag to filter by.
 * @returns {Entity|undefined} The first matching entity, or undefined if none is found.
 */
export function get_entity(dimension, location, family) {
  if (!location) return;
  const target = {
    x: Math.floor(location.x) + 0.5,
    y: Math.floor(location.y) + 0.5,
    z: Math.floor(location.z) + 0.5,
  };
  const entities = dimension.getEntities({
    families: [family],
    location: target,
    maxDistance: 0.5,
  });
  return entities[0];
}

/**
 * Charges a machine entity from connected machines' power outputs.
 *
 * This function attempts to draw energy from connected machines (using the "cosmos_power"
 * dynamic property) to charge the given machine. If no connected machine is available,
 * it falls back to checking a specific input side.
 *
 * @param {Entity} entity - The machine entity to charge.
 * @param {Block} block - The block associated with the machine.
 * @param {number} energy - The current stored energy.
 * @returns {number} The updated energy after charging.
 */
export function charge_from_machine(entity, block, energy) {
  const data = get_data(entity);
  const connectedMachines = new MachinesInNetwork(entity).getInputMachines();
  const remainingSpace = data.capacity - energy;

  if (connectedMachines && connectedMachines.length > 0 && energy < data.capacity) {
    // Precompute the list and count of input-type machines once.
    const inputMachines = connectedMachines.filter(([ , type ]) => type === "input");
    const inputCount = inputMachines.length;

    for (const [machineId, type] of connectedMachines) {
      if (type === "output" && machineId !== entity.id) {
        const sourceEntity = world.getEntity(machineId);
        if (sourceEntity) {
          const rawPower = +sourceEntity.getDynamicProperty("cosmos_power") || 0;
          // If there are input machines, distribute the power accordingly.
          const distributedPower = inputCount > 0 ? Math.floor(rawPower / (inputCount + 1)) : rawPower;
          if (distributedPower > 0) {
            energy += Math.min(data.maxInput, distributedPower, remainingSpace);
            // Optional: Deduct the transferred power from the source entity.
            // sourceEntity.setDynamicProperty("cosmos_power", rawPower - Math.min(data.maxInput, distributedPower, remainingSpace));
          }
        }
      }
    }
  } else {
    // Fallback: attempt to charge from a block side input.
    const inputLocation = location_of_side(block, data.energy_input);
    const inputEntity = get_entity(entity.dimension, inputLocation, "has_power_output");
    if (inputEntity && energy < data.capacity) {
      const inputBlock = entity.dimension.getBlock(inputLocation);
      const inputData = get_data(inputEntity);
      const power = +inputEntity.getDynamicProperty("cosmos_power") || 0;
      const ioLocation = location_of_side(inputBlock, inputData.energy_output);
      if (compare_position(floor_position(entity.location), ioLocation) && power > 0) {
        energy += Math.min(data.maxInput, power, remainingSpace);
      }
    }
  }
  return energy;
}

/**
 * Charges a machine using energy stored in a battery from its inventory.
 *
 * The function transfers energy from the battery (if present and charged) to the machine,
 * limited by the machine’s maximum input, a fixed cap (200), the battery’s available charge,
 * and the machine's remaining capacity.
 *
 * @param {Entity} machine - The machine entity to charge.
 * @param {number} energy - The current stored energy in the machine.
 * @param {number} slot - The inventory slot index where the battery is located.
 * @returns {number} The updated energy after charging from the battery.
 */
export function charge_from_battery(machine, energy, slot) {
  const data = get_data(machine);
  const container = machine.getComponent('minecraft:inventory').container;
  const battery = container.getItem(slot);
  if (battery && energy < data.capacity) {
    const batteryEnergy = battery.getDynamicProperty('energy') ?? 0;
    if (batteryEnergy > 0) {
      const remainingSpace = data.capacity - energy;
      const transfer = Math.min(data.maxInput, 200, batteryEnergy, remainingSpace);
      energy += transfer;
      const newCharge = batteryEnergy - transfer;
      container.setItem(slot, update_battery(battery, newCharge));
    }
  }
  return energy;
}

// Constants for directional adjustments.
const TURN_BY = {
  front: 0,
  left: Math.PI / 2,
  back: Math.PI,
  right: -Math.PI / 2,
};

const ROTATE_BY = {
  west: 0,
  north: Math.PI / 2,
  east: Math.PI,
  south: -Math.PI / 2,
};

/**
 * Calculates the location adjacent to a block on the specified side.
 *
 * This function takes a Block and a side (e.g., "above", "below", "left", "right", "back", or "front")
 * and returns a new location object representing the adjacent position.
 *
 * @param {Block} block - The reference block.
 * @param {string} side - The side relative to the block.
 * @returns {object|undefined} A location object with x, y, and z properties, or undefined if invalid.
 */
export function location_of_side(block, side) {
  if (!block || !block.isValid() || !side) return;

  // Clone the block's location to avoid mutating the original.
  const pos = { x: block.location.x, y: block.location.y, z: block.location.z };

  if (side === "above") {
    pos.y += 1;
    return pos;
  }
  if (side === "below") {
    pos.y -= 1;
    return pos;
  }

  const facing = block.permutation.getState("minecraft:cardinal_direction");
  if (!facing) return;

  const direction = ROTATE_BY[facing];
  pos.x += Math.round(Math.cos(direction + TURN_BY[side]));
  pos.z += Math.round(Math.sin(direction + TURN_BY[side]));
  return pos;
}

/**
 * Updates a battery item's energy and visual properties.
 *
 * This function adjusts the battery's lore (to display the current charge level with a color code),
 * sets the damage value on the durability component, and updates the "energy" property.
 *
 * @param {ItemStack} battery - The battery item.
 * @param {number} charge - The new charge level.
 * @returns {ItemStack} The updated battery item.
 */
export function update_battery(battery, charge) {
  charge = Math.floor(charge);
  // Determine color code based on charge level.
  const colorCode = charge >= 10000 ? '2' : charge < 5000 ? '4' : '6';
  battery.setLore([`§r§${colorCode}${charge} gJ/15,000 gJ`]);
  battery.getComponent('minecraft:durability').damage = 15000 - charge;
  battery.setDynamicProperty('energy', charge);
  return battery;
}
