import { world, system, DimensionTypes } from "@minecraft/server";
export { Gravity };

// --- Shared State using WeakMaps ---
const playerJumpMap = new WeakMap();
const jumpStartY = new WeakMap();
const pendingJumpSteps = new WeakMap();
const fallVelocity = new WeakMap();

/**
 * Gravity class – controls gravity behavior for an entity.
 */
class Gravity {
  constructor(entity) {
    this._entity = entity;
  }

  // Returns the underlying entity.
  get entity() {
    return this._entity;
  }

  // Retrieves the current gravity value (temporary override, dynamic property, or default 9.8).
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

  // Validates a gravity value.
  canSet(value) {
    return typeof value === "number" && value > 0 && !isNaN(value) && value !== Infinity;
  }

  // Sets a permanent gravity value.
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

  // Sets a temporary gravity value.
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

  // Sets a gravity “line” for smoothing jump transitions.
  setGravityLine(line = [1]) {
    if (!Array.isArray(this.entity.gravityLine)) {
      this.entity.gravityLine = [];
    }
    this.entity.gravityLine = line.concat(this.entity.gravityLine.slice(line.length - 1));
  }

  /**
   * Computes the gravity vector for the entity.
   * – Handles jump smoothing.
   * – Adjusts horizontal movement if input is available.
   */
  calculateGravityVector() {
    const entity = this.entity;
    const vector = { x: 0, y: -1, z: 0 };
    const power = { x: 1, y: this.value / 2, z: 1 };

    // If jumping and allowed, build a jump-smoothing “gravity line.”
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
   * Computes horizontal movement power based on active effects and movement state.
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
   * Applies knockback scaled by knockback resistance.
   */
  applyKnockbackWithDamage(targetEntity, vector, power) {
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

  // Computes the fall distance using the stored jump start Y.
  calculateFallDistance() {
    const startY = Number(jumpStartY.get(this.entity)) || 0;
    const currentY = Number(this.entity.location && this.entity.location.y) || 0;
    return Math.max(0, startY - currentY);
  }

  /**
   * Implements a smooth jump using applyKnockback.
   * To keep jumps low even in super low gravity, we compute the jump impulse based on a fixed desired height.
   * We use an effective gravity defined as the maximum of the actual gravity and 9.8.
   * The impulse is applied over a fixed duration (10 ticks).
   */
  applyJump() {
    const entity = this.entity;
    if (!entity.isOnGround || entity.isFlying) return;
    if (pendingJumpSteps.has(entity)) return; // Prevent overlapping jumps

    this.cancelPendingJumps();
    jumpStartY.set(entity, Number(entity.location && entity.location.y) || 0);

    // Define a fixed desired jump height (in blocks). This is our target maximum jump height.
    const desiredJumpHeight = 2 * (entity.isSneaking ? 0.8 : 1);
    // Use effective gravity: if actual gravity is lower than 9.8, treat it as 9.8.
    const effectiveGravity = this.value < 9.8 ? 9.8 : this.value;
    const requiredVelocity = Math.sqrt(2 * effectiveGravity * desiredJumpHeight);
    const jumpTicks = 10; // Apply impulse over 10 ticks.
    const initialPower = requiredVelocity / jumpTicks;

    const executeJumpStep = (step) => {
      if (entity.isOnGround || step >= jumpTicks) {
        pendingJumpSteps.delete(entity);
        return;
      }
      const progress = Math.sin((step / jumpTicks) * Math.PI);
      if (typeof entity.applyKnockback === "function") {
        // Apply vertical impulse; note that with our clamping, the cumulative jump should not exceed desiredJumpHeight.
        entity.applyKnockback(0, 0, 0, initialPower * progress);
      }
      const timeoutId = system.runTimeout(() => executeJumpStep(step + 1), 1);
      pendingJumpSteps.set(entity, timeoutId);
    };

    executeJumpStep(0);
  }

  // Cancels any pending jump steps.
  cancelPendingJumps() {
    const timeoutId = pendingJumpSteps.get(this.entity);
    if (timeoutId) {
      system.clearRun(timeoutId);
      pendingJumpSteps.delete(this.entity);
    }
  }
}

/**
 * Main gravity processing – runs for every entity in every dimension.
 * Gravity is applied unless the entity is swimming.
 * For players that are flying, gravity processing is skipped.
 */
function gravityFuncMain(entity) {
  if (typeof entity.isValid !== "function" || !entity.isValid()) return;
  if (entity.isSwimming) {
    resetFallVelocity(entity);
    return;
  }
  if (entity.typeId === "minecraft:player" && entity.isFlying) {
    resetFallVelocity(entity);
    return;
  }

  const gravity = new Gravity(entity);
  if (Math.abs(gravity.value - 9.8) < 0.0001) return;

  const vector = gravity.calculateGravityVector();
  const currentFall = Number(fallVelocity.get(entity)) || 0;

  if (!entity.isOnGround && !entity.isClimbing && !entity.isSwimming) {
    applyGravityEffects(entity, vector, currentFall, gravity.value);
  } else {
    resetFallVelocity(entity);
    gravity.cancelPendingJumps();
  }
}

/**
 * Applies gravity effects:
 * – Uses applyKnockback for a gravity “push.”
 * – Updates fall velocity and the dynamic "fall_distance" property.
 * – Dynamically applies a slow falling effect.
 */
async function applyGravityEffects(entity, vector, currentFall, gravityValue) {
  const fallModifier = Math.min(0, Number(currentFall));
  const knockbackPower = (Number(vector.y) * 3 + fallModifier) / 30;

  if (typeof entity.applyKnockback === "function") {
    entity.applyKnockback(
      Number(vector.x),
      Number(vector.z),
      Number(vector.hzPower),
      Number(knockbackPower)
    );
  }
  fallVelocity.set(entity, Number(currentFall) - gravityValue / 50);

  if (typeof entity.setDynamicProperty === "function") {
    const startY = Number(jumpStartY.get(entity)) || 0;
    const currentY = Number(entity.location && entity.location.y) || 0;
    const fallDist = Math.max(0, startY - currentY);
    entity.setDynamicProperty("fall_distance", fallDist);
  }

  const baseGravity = 9.8;
  const gravityDelta = gravityValue - baseGravity;
  let slowFallingAmplifier = gravityDelta > 0 ? Math.min(1, Math.floor(gravityDelta / 10)) : 0;
  let slowFallingDuration = gravityDelta > 0 ? Math.max(1, Math.ceil(gravityDelta / 10)) : 1;

  if (entity.isSneaking) {
    slowFallingAmplifier = Math.max(0, slowFallingAmplifier - 1);
    slowFallingDuration = Math.max(1, slowFallingDuration - 1);
  }

  try {
    await delay(2);
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

function resetFallVelocity(entity) {
  fallVelocity.set(entity, 0);
}

// --- Utility Functions ---
function sumObjects(obj, vec = { x: 0, y: 0, z: 0 }, multi = 1) {
  return {
    x: (Number(obj.x) || 0) + (Number(vec.x) || 0) * multi,
    y: (Number(obj.y) || 0) + (Number(vec.y) || 0) * multi,
    z: (Number(obj.z) || 0) + (Number(vec.z) || 0) * multi
  };
}

function getDirectionFromRotation(rotation) {
  const radY = (Number(rotation.y) + 90) * (Math.PI / 180);
  const radX = (Number(rotation.x) + 90) * (Math.PI / 180);
  return {
    x: Math.cos(radY),
    y: Math.cos(radX),
    z: Math.sin(radY)
  };
}

function delay(ticks) {
  return new Promise(resolve => {
    system.runTimeout(resolve, ticks * 20);
  });
}

// --- Main Loop ---
system.runInterval(() => {
  const dimensions = DimensionTypes.getAll().map(type => world.getDimension(type.typeId));
  dimensions.forEach(dimension => {
    const entities = dimension.getEntities({});
    entities.forEach(entity => {
      gravityFuncMain(entity);
    });
  });
});

/* 
 * Mace Damage System:
 * When an entity is hit, if the damaging entity is a player holding a mace,
 * extra damage is applied based on the fall distance.
 *
 * – A minimum fall of 1.5 blocks is required.
 * – For the first 3 blocks beyond 1.5: +4 hearts per block (8 damage per block).
 * – For the next 5 blocks: +2 damage per block.
 * – Beyond that: +1 damage per block.
 * Visual feedback is provided via animation and sound.
 */
world.afterEvents.entityHitEntity.subscribe(event => {
  const { damagingEntity, hitEntity } = event;
  if (damagingEntity && damagingEntity.typeId === "minecraft:player") {
    const invComp = damagingEntity.getComponent("minecraft:inventory");
    const container = invComp && invComp.container;
    if (container) {
      const selectedItem = container.getItem(damagingEntity.selectedSlot);
      if (selectedItem && selectedItem.typeId === "minecraft:mace") {
        const fallDistance = Number(damagingEntity.getDynamicProperty("fall_distance")) || 0;
        let extraDamage = 0;
        if (fallDistance >= 1.5) {
          const extraFall = fallDistance - 1.5;
          const firstSegment = Math.min(extraFall, 3);
          extraDamage += firstSegment * 8;
          const secondSegment = Math.max(0, Math.min(extraFall - 3, 5));
          extraDamage += secondSegment * 2;
          const thirdSegment = Math.max(0, extraFall - 8);
          extraDamage += thirdSegment * 1;
        }
        if (typeof hitEntity.applyDamage === "function") {
          hitEntity.applyDamage(extraDamage);
        }
        if (typeof damagingEntity.setDynamicProperty === "function") {
          damagingEntity.setDynamicProperty("fall_distance", 0);
        }
        if (typeof hitEntity.playAnimation === "function") {
          hitEntity.playAnimation("animation.hurt");
        }
        if (typeof damagingEntity.playSound === "function") {
          damagingEntity.playSound("random.orb");
        }
      }
    }
  }
});
