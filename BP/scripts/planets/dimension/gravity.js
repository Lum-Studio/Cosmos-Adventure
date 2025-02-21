import { world, system, DimensionTypes, Entity } from "@minecraft/server";
import { Vec3 } from "api/libraries/Vector";
export { Gravity };



/**
 * ✨💕 LUM STUDIO GRAVITY SYSTEM (2022-2025) 💕✨
 * Custom Gravitational Computational Engine for Minecraft Bedrock
 * Created with love and passion by LUM STUDIO. @ARR
 *
 * @author REFRACTED
 */

// --- Shared State using WeakMaps ---
/** @type {WeakMap<any, boolean>} */
const playerJumpMap = new WeakMap();
/** @type {WeakMap<any, number>} */
const jumpStartY = new WeakMap();
/** @type {WeakMap<any, number>} */
const pendingJumpSteps = new WeakMap();
/** @type {WeakMap<any, number>} */
const fallVelocity = new WeakMap();

/**
 * Class representing a custom gravity system for an entity.
 */
class Gravity {
  /**
   * Creates a Gravity instance.
   * @param {Entity} entity - The Minecraft entity.
   */
  constructor(entity) {
    this._entity = entity;
  }

  /**
   * Gets the underlying entity.
   * @return {any} The entity.
   */
  get entity() {
    return this._entity;
  }

  /**
   * Retrieves the current gravity value.
   * Checks for a temporary override or dynamic property; defaults to 9.8.
   * @return {number} The gravity value.
   */
  get value() {
    if (this.entity.tempGravityValue !== undefined) {
      return Number(this.entity.tempGravityValue) || 9.8;
    }
    if (typeof this.entity.getDynamicProperty === "function") {
      const dyn = this.entity.getDynamicProperty("sert:gravity");
      if (dyn !== undefined && dyn !== null) return Number(dyn) || 9.8;
    }
    return 9.8;
  }

  /**
   * Validates a gravity value.
   * @param {number} value - The gravity value.
   * @return {boolean} True if valid.
   */
  canSet(value) {
    return typeof value === "number" && value > 0 && !isNaN(value) && value !== Infinity;
  }

  /**
   * Sets a permanent gravity value on the entity.
   * @param {number} value - The gravity value.
   */
  set(value) {
    if (!this.canSet(value)) {
      throw new Error(
        "Failed to set gravity value(" +
        value +
        ") for " +
        this.entity.typeId +
        " (use Gravity.canSet)"
      );
    }
    if (typeof this.entity.setDynamicProperty === "function") {
      this.entity.setDynamicProperty("sert:gravity", value);
    }
  }

  /**
   * Sets a temporary gravity value on the entity.
   * @param {number} value - The temporary gravity value.
   */
  setTemp(value) {
    if (!this.canSet(value)) {
      throw new Error(
        "Failed to set gravity value(" +
        value +
        ") for " +
        this.entity.typeId +
        " (use Gravity.canSet)"
      );
    }
    this.entity.tempGravityValue = value;
  }

  /**
   * Sets the gravity "line" for jump smoothing.
   * @param {number[]} [line=[1]] - The array of impulse values.
   */
  setGravityLine(line = [1]) {
    if (!Array.isArray(this.entity.gravityLine)) {
      this.entity.gravityLine = [];
    }
    this.entity.gravityLine = line.concat(this.entity.gravityLine.slice(line.length - 1));
  }

  /**
   * Computes the gravity vector for the entity.
   * Incorporates jump smoothing and horizontal adjustments.
   * @return {Object} An object with properties x, y, z, and hzPower.
   */
  calculateGravityVector() {
    const entity = this.entity;
    const vector = { x: 0, y: -1, z: 0 };
    const power = { x: 1, y: this.value / 2, z: 1 };

    if (entity.isJumping && playerJumpMap.get(entity)) {
      playerJumpMap.set(entity, false);
      const jumpBoost =
        typeof entity.getEffect === "function" && entity.getEffect("jump_boost")
          ? Number(entity.getEffect("jump_boost").amplifier) + 1
          : 1;
      const gravityMod = Math.max(0.1, (9.8 - this.value) / 10 + 1);
      const lineLength = Math.floor(18 + (9.8 - this.value));
      const lineArray = Array.from({ length: lineLength }, (_, i) =>
        ((lineLength - i) / 6) *
        -gravityMod *
        5 *
        ((jumpBoost * 0.2 + 1)) /
        Math.max(Math.min(1, this.value), 0.005)
      );
      this.setGravityLine(lineArray);
    } else if (entity.isOnGround) {
      this.cancelPendingJumps();
      playerJumpMap.set(entity, true);
    }

    if (Array.isArray(entity.gravityLine) && entity.gravityLine.length > 0) {
      power.y += entity.gravityLine[0];
      entity.gravityLine.shift();
    }

    if (entity.inputInfo && typeof entity.inputInfo.getMovementVector === "function") {
      const movement = entity.inputInfo.getMovementVector();
      if (movement) {
        const viewDir =
          typeof entity.getViewDirection === "function"
            ? entity.getViewDirection()
            : { x: 0, y: 0, z: 0 };
        const rotation =
          typeof entity.getRotation === "function"
            ? entity.getRotation()
            : { x: 0, y: 0, z: 0 };
        const rotatedDir = getDirectionFromRotation(sumObjects(rotation, { x: 0, y: 90, z: 0 }));
        vector.x = Number(viewDir.x) * Number(movement.y) - Number(rotatedDir.x) * Number(movement.x);
        vector.z = Number(viewDir.z) * Number(movement.y) - Number(rotatedDir.z) * Number(movement.x);
      }
    }

    return {
      x: Number(vector.x),
      y: Number(power.y * vector.y),
      z: Number(vector.z),
      hzPower: this.calculateHorizontalPower(entity)
    };
  }

  /**
   * Computes horizontal movement power based on active effects.
   * @param {Entity} entity - The entity.
   * @return {number} The horizontal power.
   */
  calculateHorizontalPower(entity) {
    const speed =
      typeof entity.getEffect === "function" && entity.getEffect("speed")
        ? Number(entity.getEffect("speed").amplifier) + 1
        : 1;
    const slowness =
      typeof entity.getEffect === "function" && entity.getEffect("slowness")
        ? Number(entity.getEffect("slowness").amplifier) + 1
        : 1;
    const base = (speed - slowness) * 0.2 + 1;
    const modifier = 0.18 + (entity.isSprinting ? 0.2 : 0) - (entity.isSneaking ? 0.1 : 0);
    return base * modifier;
  }

  /**
   * Applies knockback to a target entity, scaled by its knockback resistance.
   * @param {any} targetEntity - The target entity.
   * @param {Object} vector - The gravity vector.
   * @param {Object} power - The power object.
   */
  applyKnockbackWithResistance(targetEntity, vector, power) {
    const knockbackResistance =
      typeof targetEntity.getEffect === "function" && targetEntity.getEffect("knockback_resistance")
        ? Number(targetEntity.getEffect("knockback_resistance").amplifier)
        : 0;
    const resistanceFactor = 1 + knockbackResistance * 0.2;
    const adjustedPower = {
      x: Number(vector.x) * Number(power.hzPower) * resistanceFactor,
      z: Number(vector.z) * Number(power.hzPower) * resistanceFactor,
      y: Number(vector.y) * Number(power.y) * resistanceFactor
    };

    if (typeof targetEntity.applyKnockback === "function") {
      targetEntity.applyKnockback(
        Number(adjustedPower.x),
        Number(adjustedPower.z),
        Number(vector.hzPower),
        Number(adjustedPower.y)
      );
    }
  }

  /**
   * Calculates the fall distance based on the stored jump start.
   * @return {number} The fall distance.
   */
  calculateFallDistance() {
    const startY = Number(jumpStartY.get(this.entity)) || 0;
    const currentY = Number(this.entity.location && this.entity.location.y) || 0;
    return Math.max(0, startY - currentY);
  }

  /**
   * Implements a custom jump by integrating an extra impulse.
   * The desired jump height is computed dynamically:
   * We compute the extra impulse in the steps required (v_desired - v_default) and distribute it over jumpTicks,
   * then scale it down by a multiplier.
   * @note This routine supplements the default jump; it does not cancel it.
   */
  applyJump() {
    const entity = this.entity;
    if (!entity.isOnGround || entity.isFlying) return;
    if (pendingJumpSteps.has(entity)) return;

    this.cancelPendingJumps();
    const currentY = (entity.location && typeof entity.location.y === "number")
      ? Number(entity.location.y)
      : 0;
    jumpStartY.set(entity, currentY);

    const h_default = 1.5;
    const v_default = Math.sqrt(2 * 9.8 * h_default);
    const desiredJumpHeight = h_default * Math.pow(9.8 / this.value, 0.77);
    const v_desired = Math.sqrt(2 * this.value * desiredJumpHeight);
    const extraImpulse = v_desired - v_default;
    const jumpTicks = 10;
    const multiplier = 0.0001;
    const perTickImpulse = (extraImpulse / jumpTicks) * multiplier;

    const executeJumpStep = (step) => {
      // Cancel if entity lands or jump sequence finishes.
      if (entity.isOnGround || step >= jumpTicks) {
        pendingJumpSteps.delete(entity);
        return;
      }
      // Check if a block overhead is obstructing the jump (e.g., ceiling collision)
      const overheadBlock = getBlockAbove(entity);
      if (overheadBlock && overheadBlock.typeId !== "minecraft:air") {
        pendingJumpSteps.delete(entity);
        return;
      }
      // Use movement direction to check if a block is obstructing the jump.
      const moveBlock = getBlockInMovementDirection(entity);
      if (moveBlock && moveBlock.typeId !== "minecraft:air") {
        pendingJumpSteps.delete(entity);
        return;
      }
      const progress = Math.sin((step / jumpTicks) * Math.PI);
      if (typeof entity.applyKnockback === "function") {
        entity.applyKnockback(0, 0, 0, perTickImpulse * progress);
      }
      const timeoutId = system.runTimeout(() => executeJumpStep(step + 1), 1);
      pendingJumpSteps.set(entity, timeoutId);
    };

    executeJumpStep(0);
  }

  /**
   * Cancels any pending jump steps.
   */
  cancelPendingJumps() {
    const timeoutId = pendingJumpSteps.get(this.entity);
    if (timeoutId) {
      system.clearRun(timeoutId);
      pendingJumpSteps.delete(this.entity);
    }
  }
}


/**
 * Processes gravity for a given entity.
 * Skips processing if the entity is swimming, flying, gliding, or (if a player) wearing an elytra.
 * Also zeroes horizontal impulses in narrow spaces.
 * @param {Entity} entity - The entity.
 */
function gravityFuncMain(entity) {
  // Check if entity is valid.
  if (typeof entity.isValid !== "function" || !entity.isValid()) return;

  // If swimming or (for players) flying/gliding, reset fall velocity and exit early.
  if (
    entity.isSwimming ||
    (entity.typeId === "minecraft:player" &&
      (entity.isFlying || entity.isGliding))
  ) {
    resetFallVelocity(entity);
    return;
  }

  // Create a new Gravity instance for the entity.
  const gravity = new Gravity(entity);
  // If gravity is essentially normal (9.8), skip further processing.
  if (Math.abs(gravity.value - 9.8) < 0.0001) return;

  // Calculate the gravity vector and get the current fall velocity.
  const vector = gravity.calculateGravityVector();
  const currentFall = Number(fallVelocity.get(entity)) || 0;

  // For player entities with movement input, check for obstacles in multiple directions.
  if (
    entity.typeId === "minecraft:player" &&
    typeof entity.inputInfo?.getMovementVector === "function"
  ) {
    const block = getBlockInMovementDirection(entity);
    const leftBlock = getBlockAtOffset(entity, -1, 0, 0);
    const rightBlock = getBlockAtOffset(entity, 1, 0, 0);
    if (
      (block && block.typeId !== "minecraft:air") ||
      (leftBlock && leftBlock.typeId !== "minecraft:air") ||
      (rightBlock && rightBlock.typeId !== "minecraft:air")
    ) {
      // Zero out horizontal movement if obstacles are detected.
      vector.x = 0;
      vector.z = 0;
    }
  }

  // Determine whether to use the full gravity effects or the entity version.
  if (!entity.isOnGround && !entity.isClimbing && !entity.isSwimming) {
    if (entity.typeId === "minecraft:player") {
      // Use the gravity effect for player entities.
      applyGravityEffects(entity, vector, currentFall, gravity.value);
    } else {
      // Use the gravity effect for non-player entities.
      applyGravityEntity(entity, vector, currentFall, gravity.value, gravity);
    }
  } else {
    // If on the ground or climbing, reset fall velocity and cancel any pending jump adjustments.
    resetFallVelocity(entity);
    gravity.cancelPendingJumps();
  }
}


/**
 * Applies gravity effects to a non-player entity.
 * Uses applyImpulse to simulate gravity’s downward pull,
 * updates fall velocity, and applies a dynamic slow falling effect.
 *
 * @param {Entity} entity - The non-player entity.
 * @param {Object} vector - The computed gravity vector with properties: x, z, y, and hzPower.
 * @param {number} currentFall - The current fall velocity.
 * @param {number} gravityValue - The gravity value.
 * @param {Gravity} gravity - The Gravity instance (used for fall distance calculation).
 */
async function applyGravityEntity(entity, vector, currentFall, gravityValue, gravity) {
  // Determine acceleration factor based on the block below the entity.
  const blockBelow = getBlockBelow(entity);
  let fallAccelerationFactor;
  if (blockBelow && blockBelow.typeId === "minecraft:slime_block") {
    // Bounce logic when on a slime block.
    const bounceThreshold = -0.001; // threshold for a hard fall
    if (currentFall < bounceThreshold) {
      const bounceFactor = 0.8; // retain a percentage of the fall energy
      const bounceImpulse = Math.abs(currentFall) * bounceFactor;

      // Update the fall velocity for the bounce.
      fallVelocity.set(entity, bounceImpulse);

      // Apply an upward impulse for the bounce.
      entity.applyImpulse({ x: 0, y: bounceImpulse, z: 0 });

      // Spawn bounce particle below the entity.
      const particlePos = {
        x: Math.floor(entity.location.x),
        y: Math.floor(entity.location.y - 0.5),
        z: Math.floor(entity.location.z)
      };
      entity.dimension.spawnParticle("minecraft:slime_bounce", particlePos);

      // Play bounce sound.
      entity.playSound("mob.slime.jump");

      // Bounce handled exclusively.
      return;
    } else {
      fallAccelerationFactor = gravityValue / 12;
    }
  } else {
    // Use normal acceleration for non-slime blocks.
    fallAccelerationFactor = gravityValue / 2;
  }

  // Calculate a modified fall factor.
  const fallModifier = Math.min(0, Number(currentFall));

  // Compute the knockback-equivalent vertical strength.
  // (vector.y * 3 + fallModifier) / 300 produces the vertical impulse.
  const knockbackPower = (Number(vector.y) * 3 + fallModifier) / 300;

  // Convert the original knockback parameters to an impulse vector.
  // In the original applyKnockback, we had:
  //   directionX = vector.x, directionZ = vector.z,
  //   horizontalStrength = vector.hzPower, verticalStrength = knockbackPower.
  // The inverse conversion :
  const impulse = {
    x: Number(vector.x) * Number(vector.hzPower),
    y: Number(knockbackPower),
    z: Number(vector.z) * Number(vector.hzPower)
  };

  entity.applyImpulse(impulse);

  // Update the fall velocity.
  fallVelocity.set(entity, Number(currentFall) - gravityValue / 5);

  // Update the fall distance dynamic property.
  const startY = Number(jumpStartY.get(entity)) || 0;
  const currentY = Number(entity.location?.y) || 0;
  const fallDist = Math.max(0, startY - currentY);
  entity.setDynamicProperty("fall_distance", fallDist);

  // --- Dynamic slow falling based on proximity to the ground ---
  const baseGravity = 9.8;
  const gravityDelta = gravityValue - baseGravity;
  const fallDistance = gravity.calculateFallDistance();
  let slowFallingAmplifier, slowFallingDuration;

  // If very close to the ground, cancel slow falling so the landing accelerates.
  if (fallDistance < 2) {
    slowFallingAmplifier = 0;
    slowFallingDuration = 1;
  } else {
    slowFallingAmplifier = gravityDelta > 0 ? Math.min(1, Math.floor(gravityDelta / 10)) : 0;
    slowFallingDuration = gravityDelta > 0 ? Math.max(1, Math.ceil(gravityDelta / 10)) : 1;
  }
  try {
    await delay(1);
    if (entity.isValid() && typeof entity.addEffect === "function") {
      entity.addEffect("slow_falling", slowFallingDuration, {
        amplifier: slowFallingAmplifier,
        showParticles: false
      });
    }
  } catch (err) {
    console.error("Error applying gravity effects:", err);
  }
}


/**
 * Applies gravity effects to an entity.
 * Uses applyKnockback for downward pull, updates fall velocity,
 * and applies a dynamic slow falling effect.
 * @param {Entity} entity - The entity.
 * @param {Object} vector - The computed gravity vector.
 * @param {number} currentFall - The current fall velocity.
 * @param {number} gravityValue - The gravity value.
 * @param {Gravity} gravity - The Gravity instance (used for fall distance calculation).
 */
async function applyGravityEffects(entity, vector, currentFall, gravityValue, gravity) {
  // Determine acceleration factor based on block below.
  const blockBelow = getBlockBelow(entity);
  let fallAccelerationFactor;
  if (blockBelow && blockBelow.typeId === "minecraft:slime_block") {
    // If on a slime block, check if the fall velocity is below a threshold.
    const bounceThreshold = -0.001; // threshold for a hard fall
    if (currentFall < bounceThreshold) {
      // Calculate bounce impulse relative to the current fall velocity.
      const bounceFactor = 0.8; // Retain a percentage of the fall energy.
      const bounceImpulse = Math.abs(currentFall) * bounceFactor;

      // Set the new fall velocity upward.
      fallVelocity.set(entity, bounceImpulse);

      // Apply an upward impulse for the bounce.
      if (typeof entity.applyKnockback === "function") {
        entity.applyKnockback(0, 0, 0, bounceImpulse);
      }

      // Trigger visual/audio feedback for the bounce using spawnParticle below the player.
      if (entity.dimension && entity.location && typeof entity.dimension.spawnParticle === "function") {
        const particlePos = {
          x: Math.floor(entity.location.x),
          y: Math.floor(entity.location.y - 0.5),
          z: Math.floor(entity.location.z)
        };
        entity.dimension.spawnParticle("minecraft:slime_bounce", particlePos);
      }
      if (typeof entity.playSound === "function") {
        entity.playSound("mob.slime.jump");
      }

      // Exit early so the bounce is handled exclusively.
      return;
    } else {
      // If the fall velocity isn't low enough for a bounce, use gentler acceleration.
      fallAccelerationFactor = gravityValue / 12;
    }
  } else {
    // For non-slime blocks, use normal acceleration.
    fallAccelerationFactor = gravityValue / 2;
  }
  const fallModifier = Math.min(0, Number(currentFall));
  //Knockback power to push the player up and down
  const knockbackPower = (Number(vector.y) * 3 + fallModifier) / 300;

  if (typeof entity.applyKnockback === "function") {
    entity.applyKnockback(
      Number(vector.x),
      Number(vector.z),
      Number(vector.hzPower),
      Number(knockbackPower)
    );
  }
  fallVelocity.set(entity, Number(currentFall) - gravityValue / 5);

  if (typeof entity.setDynamicProperty === "function") {
    const startY = Number(jumpStartY.get(entity)) || 0;
    const currentY = Number(entity.location && entity.location.y) || 0;
    const fallDist = Math.max(0, startY - currentY);
    entity.setDynamicProperty("fall_distance", fallDist);
  }

  // --- Dynamic slow falling based on proximity to the ground ---
  const baseGravity = 9.8;
  const gravityDelta = gravityValue - baseGravity;
  const fallDistance = gravity.calculateFallDistance();
  let slowFallingAmplifier, slowFallingDuration;
  // If very close to the ground, cancel slow falling so the landing accelerates.
  if (fallDistance < 2) {
    slowFallingAmplifier = 0;
    slowFallingDuration = 1;
  } else {
    slowFallingAmplifier = gravityDelta > 0 ? Math.min(1, Math.floor(gravityDelta / 10)) : 0;
    slowFallingDuration = gravityDelta > 0 ? Math.max(1, Math.ceil(gravityDelta / 10)) : 1;
  }

  if (entity.isSneaking) {
    slowFallingAmplifier = Math.max(0, slowFallingAmplifier - 1);
    slowFallingDuration = Math.max(1, slowFallingDuration - 1);
  }

  try {
    // Reduced delay for quicker application of slow falling.
    await delay(1);
    if (entity.isValid() && typeof entity.addEffect === "function") {
      entity.addEffect("slow_falling", slowFallingDuration, {
        amplifier: slowFallingAmplifier,
        showParticles: false
      });
    }
  } catch (err) {
    console.error("Error applying gravity effects:", err);
  }
}




/**
 * Resets the fall velocity for an entity.
 * @param {Entity} entity - The entity.
 */
function resetFallVelocity(entity) {
  fallVelocity.set(entity, 0);
}

/**
 * Sums two vector-like objects.
 * @param {Object} obj - The first vector.
 * @param {Object} [vec={x:0,y:0,z:0}] - The second vector.
 * @param {number} [multi=1] - A multiplier.
 * @return {Object} The summed vector.
 */
function sumObjects(obj, vec = { x: 0, y: 0, z: 0 }, multi = 1) {
  return {
    x: (Number(obj.x) || 0) + (Number(vec.x) || 0) * multi,
    y: (Number(obj.y) || 0) + (Number(vec.y) || 0) * multi,
    z: (Number(obj.z) || 0) + (Number(vec.z) || 0) * multi
  };
}

/**
 * Converts a rotation object to a directional vector.
 * @param {Object} rotation - The rotation object.
 * @return {Object} The direction vector.
 */
function getDirectionFromRotation(rotation) {
  const radY = (Number(rotation.y) + 90) * (Math.PI / 180);
  const radX = (Number(rotation.x) + 90) * (Math.PI / 180);
  return {
    x: Math.cos(radY),
    y: Math.cos(radX),
    z: Math.sin(radY)
  };
}

/**
 * Returns a promise that resolves after a specified number of ticks.
 * @param {number} ticks - The number of ticks.
 * @return {Promise<void>} A promise that resolves after the delay.
 */
function delay(ticks) {
  return system.waitTicks(ticks * 20);
}

// Global cache for entities that require gravity processing. Basically all entities.
const gravityEntities = new Set(
  DimensionTypes
    .getAll()
    .flatMap(d => world.getDimension(d.typeId)
      .getEntities({ type: "minecraft:player" })
    )
);



// Subscribe to generic entity spawn events for non-player entities.
world.afterEvents.entitySpawn.subscribe((eventData) => gravityEntities.add(eventData.entity));
world.afterEvents.entityLoad.subscribe((eventData) => {
  gravityEntities.has(eventData.entity) || gravityEntities.add(eventData.entity)
});

// Subscribe to player dimension change to capture players as they change dimensions.
world.afterEvents.playerDimensionChange.subscribe((eventData) => {
  if (eventData?.player) {
    gravityEntities.add(eventData.player);
  }
});

// Subscribe to player join events to capture players as they join.
world.afterEvents.playerSpawn.subscribe((eventData) => gravityEntities.add(eventData.player));

// Keep the cache up-to-date by removing entities when they are removed; same with players leaving the world.
world.beforeEvents.entityRemove.subscribe((eventData) => gravityEntities.delete(eventData.removedEntity));


// Process gravity for every cached entity once per tick.
system.runInterval(() => {
  gravityEntities.forEach(entity => {
    if (!entity.isValid()) return;
    gravityFuncMain(entity);
  });
}, 1);

/**
 * Mace Damage System:
 * When an entity is hit, if the damaging entity is a player holding a mace,
 * extra damage is applied based on the fall distance.
 * - Minimum fall distance: 1.5 blocks.
 * - For the first 3 blocks beyond 1.5: +4 hearts per block (8 damage per block).
 * - For the next 5 blocks: +2 damage per block.
 * - Beyond that: +1 damage per block.
 * Visual feedback is provided.
//  */
// world.afterEvents.entityHitEntity.subscribe(event => {
//   const { damagingEntity, hitEntity } = event;
//   if (damagingEntity && damagingEntity.typeId === "minecraft:player") {
//     const invComp = damagingEntity.getComponent("minecraft:inventory");
//     const container = invComp && invComp.container;
//     if (container) {
//       const selectedItem = container.getItem(damagingEntity.selectedSlot);
//       if (selectedItem && selectedItem.typeId === "minecraft:mace") {
//         const fallDistance = Number(damagingEntity.getDynamicProperty("fall_distance")) || 0;
//         let extraDamage = 0;
//         if (fallDistance >= 1.5) {
//           const extraFall = fallDistance - 1.5;
//           const firstSegment = Math.min(extraFall, 3);
//           extraDamage += firstSegment * 8;
//           const secondSegment = Math.max(0, Math.min(extraFall - 3, 5));
//           extraDamage += secondSegment * 2;
//           const thirdSegment = Math.max(0, extraFall - 8);
//           extraDamage += thirdSegment * 1;
//         }
//         if (typeof hitEntity.applyDamage === "function") {
//           hitEntity.applyDamage(extraDamage);
//         }
//         if (typeof damagingEntity.setDynamicProperty === "function") {
//           damagingEntity.setDynamicProperty("fall_distance", 0);
//         }
//         if (typeof hitEntity.playAnimation === "function") {
//           hitEntity.playAnimation("animation.hurt");
//         }
//         if (typeof damagingEntity.playSound === "function") {
//           damagingEntity.playSound("random.orb");
//         }
//       }
//     }
//   }
// });

/**
 * Gets the block above the entity's head.
 * @param {Entity} entity - The entity.
 * @return {any|null} The block above the entity or null if unavailable.
 */
function getBlockAbove(entity) {
  if (entity.dimension && typeof entity.dimension.getBlock === "function") {
    const loc = entity.location;
    loc.y += 1.8;
    return entity.dimension.getBlock(loc);
  }
  return null;
}

/**
 * Gets the block in the direction the entity is moving.
 * Validates that location and movement vector values are numbers.
 * @param {Entity} entity - The entity.
 * @return {any|null} The block in the movement direction or null if unavailable.
 */
function getBlockInMovementDirection(entity) {
  if (
    !entity.location ||
    typeof entity.location.x !== "number" ||
    typeof entity.location.y !== "number" ||
    typeof entity.location.z !== "number"
  ) {
    return null;
  }
  if (typeof entity.inputInfo?.getMovementVector !== "function") return null;
  const movement = entity.inputInfo.getMovementVector();
  if (
    typeof movement.x !== "number" ||
    typeof movement.y !== "number" ||
    typeof movement.z !== "number"
  ) {
    return null;
  }
  const magnitude = Math.sqrt(movement.x ** 2 + movement.y ** 2 + movement.z ** 2);
  if (magnitude === 0) return null;

  // Normalize the movement vector.
  const direction = {
    x: movement.x / magnitude,
    y: movement.y / magnitude,
    z: movement.z / magnitude
  };

  // Check one block ahead in the direction of movement.
  const checkDistance = 1;
  const pos = {
    x: Math.floor(entity.location.x + direction.x * checkDistance),
    y: Math.floor(entity.location.y + direction.y * checkDistance),
    z: Math.floor(entity.location.z + direction.z * checkDistance)
  };

  if (entity.dimension && typeof entity.dimension.getBlock === "function") {
    return entity.dimension.getBlock(pos);
  }
  return null;
}

/**
 * Gets the block at an offset from the entity's location.
 * Ensures that the entity's location values are valid numbers.
 * @param {Entity} entity - The entity.
 * @param {number} offsetX - Offset on the X axis.
 * @param {number} offsetY - Offset on the Y axis.
 * @param {number} offsetZ - Offset on the Z axis.
 * @return {any|null} The block at the offset or null if unavailable.
 */
function getBlockAtOffset(entity, offsetX, offsetY, offsetZ) {
  try {
    return entity.dimension.getBlock(Vec3(offsetX, offsetY, offsetZ).add(entity.location));
  } catch (error) {
    return null;
  }
}

/**
 * Gets the block just below the entity.
 * Ensures that the entity's location values are valid numbers.
 * @param {Entity} entity - The entity.
 * @return {any|null} The block below the entity or null if unavailable.
 */
function getBlockBelow(entity) {
  return entity.dimension.getBlock(Vec3.down.add(entity.location));
}
