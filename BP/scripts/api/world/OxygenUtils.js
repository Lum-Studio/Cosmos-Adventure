import { world } from "@minecraft/server";
import EndlessDB from "../libraries/EndlessDB";

// Dynamic property stores for oxygen data.
const oxygenBlockStore = new EndlessDB("oxygenBlock:");
const oxygenPermeableStore = new EndlessDB("oxygenPermeable:");
const oxygenBubbleStore = new EndlessDB("oxygenBubble:");

class OxygenUtil {
  // Used to prevent infinite recursion in oxygen searches.
  static checked = new Set();
/**
 * Determines if an entity's approximate bounding box is in breathable air.
 * @param {object} entity - The entity
 * @param {boolean} testThermal - If true, require thermal oxygen.
 * @returns {boolean} True if the entity is in breathable air.
 */
static isAABBInBreathableAirBlock(entity, testThermal = false) {
    // Retrieve the entity's head location using the valid getHeadLocation() method.
    const head = entity.getHeadLocation();
    // Construct a small bounding box around the head.
    const aabb = {
      min: { x: head.x - 0.3, y: head.y - 0.3, z: head.z - 0.3 },
      max: { x: head.x + 0.3, y: head.y + 0.3, z: head.z + 0.3 }
    };
    return this.isAABBInBreathableAirBlockWorld(aabb, testThermal);
  }  

  /**
   * Checks whether a given axis-aligned bounding box is in breathable air.
   * First checks if the center is inside an oxygen bubble, then recursively searches
   * for oxygen-providing blocks.
   *
   * @param {object} aabb - An object with min and max {x, y, z}.
   * @param {boolean} testThermal - Require thermal oxygen if true.
   * @returns {boolean} True if the AABB is in breathable air.
   */
  static isAABBInBreathableAirBlockWorld(aabb, testThermal = false) {
    const avgX = (aabb.min.x + aabb.max.x) / 2;
    const avgY = (aabb.min.y + aabb.max.y) / 2;
    const avgZ = (aabb.min.z + aabb.max.z) / 2;
    if (testThermal) {
      return this.isInOxygenAndThermalBlock(aabb);
    }
    if (this.inOxygenBubble(avgX, avgY, avgZ)) {
      return true;
    }
    return this.isInOxygenBlock(aabb);
  }

  /**
   * Iterates over the blocks within the AABB to see if any provide breathable air.
   * @param {object} aabb - The axis-aligned bounding box.
   * @returns {boolean} True if oxygen is found.
   */
  static isInOxygenBlock(aabb) {
    const xm = Math.floor(aabb.min.x + 0.001);
    const xx = Math.floor(aabb.max.x - 0.001);
    const ym = Math.floor(aabb.min.y + 0.001);
    const yy = Math.floor(aabb.max.y - 0.001);
    const zm = Math.floor(aabb.min.z + 0.001);
    const zz = Math.floor(aabb.max.z - 0.001);
    this.checked.clear();
    for (let x = xm; x <= xx; x++) {
      for (let y = ym; y <= yy; y++) {
        for (let z = zm; z <= zz; z++) {
          const res = this.testContactWithBreathableAir(x, y, z, 0);
          if (res >= 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * Similar to isInOxygenBlock but requires thermal oxygen.
   * @param {object} aabb - The axis-aligned bounding box.
   * @returns {boolean} True if thermal oxygen is detected.
   */
  static isInOxygenAndThermalBlock(aabb) {
    const xm = Math.floor(aabb.min.x + 0.001);
    const xx = Math.floor(aabb.max.x - 0.001);
    const ym = Math.floor(aabb.min.y + 0.001);
    const yy = Math.floor(aabb.max.y - 0.001);
    const zm = Math.floor(aabb.min.z + 0.001);
    const zz = Math.floor(aabb.max.z - 0.001);
    this.checked.clear();
    for (let x = xm; x <= xx; x++) {
      for (let y = ym; y <= yy; y++) {
        for (let z = zm; z <= zz; z++) {
          const res = this.testContactWithBreathableAir(x, y, z, 0);
          // Here, a result of 1 indicates thermal oxygen.
          if (res === 1) return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if a torch-like block has access to oxygen.
   * First tests if it lies in an oxygen bubble; if not, it examines adjacent blocks.
   * @param {object} pos - A vector with {x, y, z}.
   * @returns {boolean} True if oxygen is accessible.
   */
  static checkTorchHasOxygen(pos) {
    if (this.inOxygenBubble(pos.x + 0.5, pos.y + 0.6, pos.z + 0.5)) return true;
    this.checked.clear();
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    for (const d of directions) {
      const nx = Math.floor(pos.x + d.x);
      const ny = Math.floor(pos.y + d.y);
      const nz = Math.floor(pos.z + d.z);
      const res = this.testContactWithBreathableAir(nx, ny, nz, 1);
      if (res >= 0) return true;
    }
    return false;
  }

  /**
   * Recursively checks whether the block at (x, y, z) either provides oxygen
   * or is permeable enough for oxygen to pass through.
   *
   * Uses EndlessDB data:
   *   - oxygenBlockStore: contains oxygen values (0 = normal, 1 = thermal) keyed by "x_y_z".
   *   - oxygenPermeableStore: marks blocks as permeable (true/false).
   *
   * @param {number} x - Block x-coordinate.
   * @param {number} y - Block y-coordinate.
   * @param {number} z - Block z-coordinate.
   * @param {number} limit - Recursion depth (max 5).
   * @returns {number} A value >= 0 if oxygen is found, or -1 if not.
   */
  static testContactWithBreathableAir(x, y, z, limit) {
    const key = `${x}_${y}_${z}`;
    if (this.checked.has(key)) return -1;
    this.checked.add(key);
    const blockData = oxygenBlockStore.getAll();
    const oxygenVal = blockData[key];
    if (typeof oxygenVal === "number" && oxygenVal >= 0) return oxygenVal;
    const permeableData = oxygenPermeableStore.getAll();
    const permeable = permeableData[key] === true;
    if (!permeable) return -1;
    if (limit < 5) {
      const directions = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
      ];
      for (const d of directions) {
        const res = this.testContactWithBreathableAir(x + d.x, y + d.y, z + d.z, limit + 1);
        if (res >= 0) return res;
      }
    }
    return -1;
}

  /**
   * Validates if the player is wearing proper oxygen gear.
   *   - "cosmos:oxygen_mask" must be true.
   *   - "cosmos:oxygen_gear" must be true.
   *   - At least one of "cosmos:tank1" or "cosmos:tank2" must not be "no_tank".
   * @param {object} player - The player object.
   * @returns {boolean} True if the player's oxygen setup is valid.
   */
  static hasValidOxygenSetup(player) {
    const maskOk = player.getProperty("cosmos:oxygen_mask") === true;
    const gearOk = player.getProperty("cosmos:oxygen_gear") === true;
    const tank1 = player.getProperty("cosmos:tank1");
    const tank2 = player.getProperty("cosmos:tank2");
    const tankOk = (tank1 && tank1 !== "no_tank") || (tank2 && tank2 !== "no_tank");
    return maskOk && gearOk && tankOk;
  }

  /**
   * Determines whether atmospheric combustion is disabled (i.e. oxygen is absent).
   * Expects a world-level dynamic property "atmospheric_oxygen" (true if oxygen is present).
   * @returns {boolean} True if combustion is disabled.
   */
  static noAtmosphericCombustion() {
    const oxygen = world.getDynamicProperty("atmospheric_oxygen");
    return oxygen === false;
  }

  /**
   * Checks whether a specific position is inside an oxygen bubble.
   * Looks up the coordinate in the oxygenBubbleStore using the key "x_y_z".
   * @param {number} x - X-coordinate.
   * @param {number} y - Y-coordinate.
   * @param {number} z - Z-coordinate.
   * @returns {boolean} True if inside an oxygen bubble.
   */
  static inOxygenBubble(x, y, z) {
    const bubbleData = oxygenBubbleStore.getAll();
    const key = `${Math.floor(x)}_${Math.floor(y)}_${Math.floor(z)}`;
    return bubbleData[key] === true;
  }

  /**
   * Ticks oxygen usage for all players.
   * For each player, it:
   *   - Retrieves oxygen tank values ("oxygen_tank1" and "oxygen_tank2").
   *   - Ensures nonnegative values.
   *   - Checks if the player's gear is valid (and if the player "needs" oxygen via checkOxygen).
   *   - Adds the "oxygen" tag if oxygen remains, otherwise removes it.
   *   - Decrements the appropriate tank value.
   */
  static tickOxygenTanks() {
    const players = world.getAllPlayers();
    for (const player of players) {
      let v1 = player.getDynamicProperty("oxygen_tank1") ?? 0;
      let v2 = player.getDynamicProperty("oxygen_tank2") ?? 0;
      if (v1 < 0) {
        v1 = 0;
        player.setDynamicProperty("oxygen_tank1", 0);
      }
      if (v2 < 0) {
        v2 = 0;
        player.setDynamicProperty("oxygen_tank2", 0);
      }
      // If the player does not have a valid oxygen setup or fails the oxygen check, remove the "oxygen" tag.
      if (!this.hasValidOxygenSetup(player) || !this.checkOxygen(player)) {
        player.removeTag("oxygen");
        continue;
      }
      // If there is oxygen remaining in tanks, add the "oxygen" tag; otherwise remove it.
      if (v1 + v2 > 0) {
        player.addTag("oxygen");
      } else {
        player.removeTag("oxygen");
        continue;
      }
      // Decrement oxygen tank values.
      if (v1 > 0) {
        player.setDynamicProperty("oxygen_tank1", v1 - 1);
      } else if (v2 > 0) {
        // If v1 is zero but v2 is available, transfer usage from v2.
        player.setDynamicProperty("oxygen_tank1", v2 - 1);
      }
    }
  }

  /**
   * Returns true when the player needs oxygen from tanks.
   * For now, this simply checks if the player has the "oxy_test" tag.
   * UNDER DEV METHOD
   * @param {object} player - The player to check.
   * @returns {boolean} True if oxygen is needed.
   */
  static checkOxygen(player) {
    return player.hasTag("oxy_test");
  }
}

export default OxygenUtil;