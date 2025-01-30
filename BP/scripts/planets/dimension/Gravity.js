import { world, system, DimensionTypes } from "@minecraft/server";
export { Gravity }

/**
 * Class representing gravity control for an entity.
 */
class Gravity {
    /**
     * Creates an instance of Gravity.
     * @param {Object} entity - The entity whose gravity will be controlled.
     */
    constructor(entity) {
        this.#entity = entity;
    }
    
    #entity;

    /**
     * Gets the entity associated with this Gravity instance.
     * @returns {Object} The entity.
     */
    get entity() {
        return this.#entity;
    }

    /**
     * Gets the current gravity value for the entity.
     * @returns {number} The current gravity value.
     */
    get value() {
        return this.entity.tempGravityValue || this.entity.getDynamicProperty('sert:gravity') || 9.8;
    }

    /**
     * Sets a permanent gravity value for the entity.
     * @param {number} value - The gravity value to set. Must be greater than 0.
     * @throws {Error} If the gravity value cannot be set.
     */
    set(value) {
        if (!this.canSet(value)) {
            throw new Error('Failed to set gravity value(' + value + ') for ' + this.entity.typeId + ' (use Gravity.canSet)');
        }
        this.#entity.setDynamicProperty('sert:gravity', value);
    }

    /**
     * Sets a temporary gravity value for the entity.
     * @param {number} value - The temporary gravity value to set. Must be greater than 0.
     * @throws {Error} If the temporary gravity value cannot be set.
     */
    setTemp(value) {
        if (!this.canSet(value)) {
            throw new Error('Failed to set gravity value(' + value + ') for ' + this.entity.typeId + ' (use Gravity.canSet)');
        }
        this.entity.tempGravityValue = value;
    }

    /**
     * Checks if a gravity value can be set for the entity.
     * @param {number} value - The gravity value to check.
     * @returns {boolean} True if the value can be set; otherwise, false.
     */
    canSet(value) {
        if (typeof value !== 'number') return false;
        if (value <= 0) return false;
        if (isNaN(value)) return false;
        if (value === Infinity) return false;
        return true;
    }

    /**
     * Sets the gravity line for the entity.
     * @param {Array<number>} line - The gravity line values to set.
     */
    setGravityLine(line = [1]) {
        this.entity.gravityLine = (this.entity.gravityLine || []);
        this.entity.gravityLine = line.concat(this.entity.gravityLine.slice(line.length - 1));
    }

    /**
     * Calculates the gravity vector for the entity.
     * @returns {Object} The gravity vector with x, y, z components and horizontal power.
     */
    calculateGravityVector() {
        let entity = this.entity;
        let vector = {
            x: 0,
            z: 0,
            y: -1
        };

        let power = {
            x: 1,
            z: 1,
            y: this.value / 2
        };

        // Handle jumping and gravity line modifications
        if (entity.isJumping && playerJumpMap.get(entity) !== true) {
            playerJumpMap.set(entity, true);
            let mod = (((entity.getEffect('jump_boost')?.amplifier + 1) || 0) * 0.2 + 1) / Math.max((Math.min(1, this.value)), 0.005);
            this.setGravityLine(new Array(4).fill(-19 * mod).concat([-16 * mod, -12 * mod, -7 * mod, -5 * mod, -2 * mod]));
        } else if (entity.isOnGround) {
            playerJumpMap.set(entity, false);
        }

        // Update gravity power based on gravity line
        if (entity.gravityLine !== undefined && entity.gravityLine[0] !== undefined) {
            power.y += entity.gravityLine[0];
            entity.gravityLine.splice(0, 1);
        }

        // Calculate movement direction for players
        if (entity.typeId === 'minecraft:player') {
            let movement = entity.inputInfo.getMovementVector();
            let direction = sumObjects(sumObjects({}, entity.getViewDirection(), movement.y), getDirectionFromRotation(sumObjects(entity.getRotation(), { y: 90 })), -movement.x);
            vector.x = direction.x;
            vector.z = direction.z;
        }

        return {
            x: vector.x,
            z: vector.z,
            y: power.y * vector.y,
            hzPower: ((((entity.getEffect('speed')?.amplifier + 1) || 0) - ((entity.getEffect('slowness')?.amplifier + 1) || 0)) * 0.2 + 1) * (0.23 + (entity.isSprinting ? 0.2 : 0) - (entity.isSneaking ? 0.1 : 0))
        };
    }
}



/**
 * @type {WeakMap<Object, boolean>} A map to track player jump states.
 */
let playerJumpMap = new WeakMap();

/**
 * @type {WeakMap<Object, number>} A map to track previous Y positions of entities.
 */
let oldYMap = new WeakMap();

/**
 * @type {WeakMap<Object, number>} A map to track fall velocities of entities.
 */
let fallVelocity = new WeakMap();

/**
 * Runs gravity calculations at regular intervals for all players in the world.
 */
system.runInterval(() => {
    for (let dimension of DimensionTypes.getAll().map(type => world.getDimension(type.typeId))) {
        for (let entity of dimension.getEntities({
            type: 'player'
        })) {
            gravityFuncMain(entity);
        }
    }
});

function gravityFuncMain(entity) {
    let gravity = new Gravity(entity)
    if (gravity.value.toFixed(4) == 9.8) return;

    let vector = gravity.calculateGravityVector()
    let dist = fallVelocity.get(entity) || gravity.value/3
    if (!entity.isOnGround && !entity.isClimbing && !entity.isFlying && !entity.isGliding) {
        entity.applyKnockback(vector.x, vector.z, vector.hzPower,  (vector.y + Math.min(0, dist))/40)
        fallVelocity.set(entity, dist - gravity.value/17)
        entity.addEffect('slow_falling', 2, {amplifier: 1, showParticles: false})
    } else {
        fallVelocity.set(entity, 0)
    }
    oldYMap.set(entity, entity.location.y)
}



function sumObjects(objects, vector = undefined,  multi = 1) {
    return {
        x: (objects.x || 0) + (vector.x || 0) * multi,
        y: (objects.y || 0) + (vector.y || 0) * multi,
        z: (objects.z || 0) + (vector.z || 0) * multi
    }
}


function getDirectionFromRotation(rotation) {
    let angle = {
      x: (rotation.y + 90)/57.2958,
      y: (rotation.x + 90)/57.2958
    }
    let point = {
      x: Math.cos(angle.x),
      y: Math.cos(angle.y),
      z: Math.sin(angle.x)
    }
    return point
  }
