import { system, world } from "@minecraft/server";

/**
 * [not finished] OxygenHooks class – Bedrock Scripting API port of Galacticraft’s OxygenHooks.
 * 
 * This class provides methods that replicate the original Java methods:
 * - noAtmosphericCombustion: Checks if fire should not burn because the atmosphere lacks oxygen.
 * - isAABBInBreathableAirBlock: Checks if a given axis-aligned bounding box (AABB) is inside breathable air.
 * - isAABBInBreathableAirBlockEntity: A variant for entities (using a small box around the entity’s head).
 * - checkTorchHasOxygen: Checks for breathable air adjacent to a torch’s position.
 * - inOxygenBubble: Determines if a location is inside an oxygen bubble.
 * - hasValidOxygenSetup: Checks if a player is equipped with a valid oxygen setup.
 * 
 */
export class OxygenHooks {
  /**
   * Test whether fire can burn in this world's atmosphere (outside any oxygen bubble).
   * Returns false if fire burns normally (oxygen present), true if fire cannot burn.
   * 
   * @param {object} world - The world object.
   * @returns {boolean}
   */
  static noAtmosphericCombustion(world) {
    // Expect a world-level dynamic property "oxygen_atmosphere" to be set:
    //   true  = oxygen-rich (fire burns normally)
    //   false = oxygen-poor (fire cannot burn)
    const oxygenAtmosphere = world.getDynamicProperty("oxygen_atmosphere");
    if (oxygenAtmosphere === null) {
      // If not defined, assume oxygen-rich.
      return false;
    }
    // If oxygenAtmosphere is false, then combustion is disabled.
    return oxygenAtmosphere === false;
  }

  /**
   * Test whether a bounding box is inside breathable air.
   * 
   * @param {object} world - The world object.
   * @param {object} aabb - The axis-aligned bounding box in the form:
   *   { min: { x, y, z }, max: { x, y, z } }.
   * @returns {boolean}
   */
  static isAABBInBreathableAirBlock(world, aabb) {
    // Use the center point of the bounding box to check for breathable air.
    const center = {
      x: (aabb.min.x + aabb.max.x) / 2,
      y: (aabb.min.y + aabb.max.y) / 2,
      z: (aabb.min.z + aabb.max.z) / 2,
    };
    return this.isPositionInBreathableAirBlock(world, center.x, center.y, center.z);
  }

  /**
   * Special version of the AABB check for living entities.
   * This function checks a small box centered at the entity's eye height,
   * approximating head position.
   * 
   * @param {object} entity - The entity (assumed to have properties: position, width, and optionally eyeHeight).
   * @returns {boolean}
   */
  static isAABBInBreathableAirBlockEntity(entity) {
    // Get the entity's base position.
    const pos = entity.position;
    // Use provided eyeHeight or a default value (e.g. 1.62 for a player).
    const eyeHeight = entity.eyeHeight ?? 1.62;
    // Calculate the center at eye level.
    const center = {
      x: pos.x,
      y: pos.y + eyeHeight,
      z: pos.z,
    };
    // Use the entity's width (or default) to create a small bounding box.
    const width = entity.width ?? 0.6;
    const halfSide = width / 4; // Box side equals half the entity's width.
    const aabb = {
      min: { x: center.x - halfSide, y: center.y - halfSide, z: center.z - halfSide },
      max: { x: center.x + halfSide, y: center.y + halfSide, z: center.z + halfSide },
    };
    // Use the global world (or entity.dimension if available) for checking.
    return this.isAABBInBreathableAirBlock(world, aabb);
  }

  /**
   * Helper function to determine if a specific position is in breathable air.
   * This function checks a dynamic property set on the world at the block coordinates.
   * 
   * @param {object} world - The world object.
   * @param {number} x - X-coordinate.
   * @param {number} y - Y-coordinate.
   * @param {number} z - Z-coordinate.
   * @returns {boolean}
   */
  static isPositionInBreathableAirBlock(world, x, y, z) {
    // Convert to block (integer) coordinates.
    const key = `breathable_${Math.floor(x)}_${Math.floor(y)}_${Math.floor(z)}`;
    return world.getDynamicProperty(key) === true;
  }

  /**
   * Simplified check for oxygen access on a torch.
   * This function checks all 6 adjacent blocks for breathable air.
   * 
   * @param {object} world - The world object.
   * @param {object} pos - The block position { x, y, z } of the torch.
   * @returns {boolean}
   */
  static checkTorchHasOxygen(world, pos) {
    // Define the 6 cardinal directions.
    const directions = [
      { dx: 1, dy: 0, dz: 0 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 },
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
      { dx: 0, dy: 0, dz: -1 },
    ];
    for (const dir of directions) {
      const nx = pos.x + dir.dx;
      const ny = pos.y + dir.dy;
      const nz = pos.z + dir.dz;
      if (this.isPositionInBreathableAirBlock(world, nx, ny, nz)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Test whether a location is inside an oxygen bubble.
   * @param {object} world - The world object.
   * @param {number} x - Average X coordinate.
   * @param {number} y - Average Y coordinate.
   * @param {number} z - Average Z coordinate.
   * @returns {boolean}
   */
  static inOxygenBubble(world, x, y, z) {
    // Check a dynamic property specific to oxygen bubbles.
    const key = `oxygenBubble_${Math.floor(x)}_${Math.floor(y)}_${Math.floor(z)}`;
    return world.getDynamicProperty(key) === true;
  }

  /**
   * Test whether a player is wearing a valid oxygen-breathing setup.
   * The player's oxygen setup is assumed to be marked by a dynamic property.
   * 
   * @param {object} player - The player object (should have an id property).
   * @returns {boolean}
   */
  static hasValidOxygenSetup(player) {
    const key = `oxygenSetup_${player.id}`;
    return world.getDynamicProperty(key) === true;
  }
}
