import { world, system, DimensionTypes } from "@minecraft/server";
export { Gravity }

import { world, system, DimensionTypes } from "@minecraft/server";
export { Gravity }

class Gravity {
    // The entity whose gravity you want to control
    constructor(entity) {
        this.#entity = entity 
    }
    #entity

    get entity() {
        return this.#entity
    }

    // Current gravity value (number)
    get value() {
        return this.entity.tempGravityValue || this.entity.getDynamicProperty('sert:gravity') || 9.8
    }


    // Sets a permanent gravity value for this entity. It will not be lost after the world is rebooted (number > 0)
    set(value) {
        if (!this.canSet(value)) throw new Error('Failed to set gravity value(' + value + ') for ' + this.entity.typeId + ' (use Gravity.canSet)');
        this.#entity.setDynamicProperty('sert:gravity', value)
    }

    // Sets the temporary gravity value for this entity. It will be lost after the world is rebooted (number > 0)
    setTemp(value) {
        if (!this.canSet(value)) throw new Error('Failed to set gravity value(' + value + ') for ' + this.entity.typeId + ' (use Gravity.canSet)');
        this.entity.tempGravityValue = value
    }


    //Checks whether it is possible to set such a gravity value for this entity
    canSet(value) {
        if (typeof value != 'number') return false;
        if (value <= 0) return false;
        if (isNaN(value)) return false;
        if (value == Infinity) return false;
        return true
    }


    setGravityLine(line = [1]) {
        this.entity.gravityLine = (this.entity.gravityLine || [])
        this.entity.gravityLine = line.concat(this.entity.gravityLine.slice(line.length-1))
    }

    calculateGravityVector() {
        let entity = this.entity
        let vector = {
            x: 0,
            z: 0,
            y: -1
        }

        let power = {
            x: 1,
            z: 1,
            y: this.value/2
        }

        if (entity.isJumping && playerJumpMap.get(entity) != true) {
            playerJumpMap.set(entity, true)
            let mod = (((entity.getEffect('jump_boost')?.amplifier + 1) || 0)*0.2 + 1)/Math.max((Math.min(1, this.value)), 0.005)
            this.setGravityLine(new Array(4).fill(-19*mod).concat([-16*mod, -12*mod, -7*mod, -5*mod, -2*mod]))
        } else if (entity.isOnGround) {
            playerJumpMap.set(entity, false)
        }

        if (entity.gravityLine != undefined && entity.gravityLine[0] != undefined) {
            power.y += entity.gravityLine[0]
            entity.gravityLine.splice(0, 1)
        }

        if (entity.typeId == 'minecraft:player') {
            let movement = entity.inputInfo.getMovementVector()
            let direction = sumObjects(sumObjects({}, entity.getViewDirection(), movement.y), getDirectionFromRotation(sumObjects(entity.getRotation(), { y: 90 })), -movement.x)
            vector.x = direction.x
            vector.z = direction.z
        }

        return {
            x: vector.x,
            z: vector.z,
            y: power.y*vector.y,
            hzPower: ((((entity.getEffect('speed')?.amplifier + 1) || 0) - ((entity.getEffect('slowness')?.amplifier + 1) || 0))*0.2 + 1)*(0.23 + (entity.isSprinting ? 0.2 : 0) - (entity.isSneaking ? 0.1 : 0))
        }
    }
}

let playerJumpMap = new WeakMap()
let oldYMap = new WeakMap()
let fallVelocity = new WeakMap()

system.runInterval(() => {
    for (let dimension of DimensionTypes.getAll().map(type => world.getDimension(type.typeId))) {
        for (let entity of dimension.getEntities({
            type: 'player'
        })) {
            gravityFuncMain(entity)
        }
    }
})

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



// /*
// *Class representing gravity control for entities
// */
// class Gravity {
//     constructor(entity) {
//         this.#entity = entity; // Store the entity reference
//     }

//     #entity;

//     // Get the entity associated with this Gravity instance
//     get entity() {
//         return this.#entity;
//     }

//     // Get the current gravity value for the entity
//     get value() {
//         return this.entity.tempGravityValue || this.entity.getDynamicProperty('sert:gravity') || 9.8;
//     }

//     // Set a permanent gravity value for the entity
//     set(value) {
//         if (!this.canSet(value)) {
//             throw new Error('Failed to set gravity value(' + value + ') for ' + this.entity.typeId + ' (use Gravity.canSet)');
//         }
//         this.#entity.setDynamicProperty('sert:gravity', value);
//     }

//     // Set a temporary gravity value for the entity
//     setTemp(value) {
//         if (!this.canSet(value)) {
//             throw new Error('Failed to set gravity value(' + value + ') for ' + this.entity.typeId + ' (use Gravity.canSet)');
//         }
//         this.entity.tempGravityValue = value;
//     }

//     // Check if a gravity value can be set for the entity
//     canSet(value) {
//         return typeof value === 'number' && value > 0 && !isNaN(value) && value !== Infinity;
//     }

//     // Set the gravity line for the entity
//     setGravityLine(line = [1]) {
//         this.entity.gravityLine = (this.entity.gravityLine || []);
//         this.entity.gravityLine = line.concat(this.entity.gravityLine.slice(line.length - 1));
//     }

//     // Calculate the gravity vector for the entity
//     calculateGravityVector() {
//         const entity = this.entity;
//         const vector = { x: 0, z: 0, y: -1 };
//         const power = { x: 1, z: 1, y: this.value / 2 };

//         // Handle jump state transitions
//         if (entity.isJumping && playerJumpMap.get(entity)) {
//             playerJumpMap.set(entity, false);
//             const jumpBoost = (entity.getEffect('jump_boost')?.amplifier + 1) || 0;
//             const gravityMod = Math.max(0.1, (9.8 - this.value) / 10 + 1);
//             const lineLength = Math.floor(18 + (9.8 - this.value));
            
//             this.setGravityLine(
//                 Array.from({length: lineLength}, (_, i) => 
//                     (lineLength - i) / 6 * -gravityMod * 5 * 
//                     ((jumpBoost * 0.2) + 1) / Math.max(Math.min(1, this.value), 0.005)
//                 )
//             );
//         } else if (entity.isOnGround) {
//             this.cancelPendingJumps();
//             playerJumpMap.set(entity, true);
//         }

//         // Process gravity line
//         if (entity.gravityLine?.[0] !== undefined) {
//             power.y += entity.gravityLine[0];
//             entity.gravityLine.shift();
//         }

//         // Player movement calculations
//         if (entity.typeId === 'minecraft:player') {
//             const movement = entity.inputInfo.getMovementVector();
//             const viewDir = entity.getViewDirection();
//             const rotatedDir = getDirectionFromRotation(
//                 sumObjects(entity.getRotation(), { y: 90 })
//             );
            
//             vector.x = viewDir.x * movement.y - rotatedDir.x * movement.x;
//             vector.z = viewDir.z * movement.y - rotatedDir.z * movement.x;
//         }

//         // Calculate final forces
//         return {
//             x: vector.x,
//             z: vector.z,
//             y: power.y * vector.y,
//             hzPower: this.calculateHorizontalPower(entity)
//         };
//     }

//     // Calculate horizontal movement power
//     calculateHorizontalPower(entity) {
//         const speed = (entity.getEffect('speed')?.amplifier + 1) || 0;
//         const slowness = (entity.getEffect('slowness')?.amplifier + 1) || 0;
//         return ((speed - slowness) * 0.2 + 1) * 
//                (0.18 + (entity.isSprinting ? 0.2 : 0) - 
//                (entity.isSneaking ? 0.1 : 0));
//     }

//     // Apply knockback with resistance and mace damage
//     applyKnockbackWithDamage(entity, vector, power) {
//         const knockbackResistance = entity.getEffect('knockback_resistance')?.amplifier || 0;
//         const resistanceFactor = 1 - Math.min(1, knockbackResistance * 1.2); // 20% reduction per level

//         // Adjust knockback power based on resistance
//         const adjustedPower = {
//             x: vector.x * power.hzPower * resistanceFactor,
//             z: vector.z * power.hzPower * resistanceFactor,
//             y: vector.y * power.y * resistanceFactor
//         };

//         // Apply knockback
//         entity.applyKnockback(adjustedPower.x, adjustedPower.z, adjustedPower.hzPower, adjustedPower.y);

//             }

//     // Calculate fall distance for mace damage
//     calculateFallDistance() {
//         const entity = this.entity;
//         const startY = jumpStartY.get(entity) || entity.location.y;
//         return Math.max(0, startY - entity.location.y);
//     }
//     calculateGravityVector() {
//         const entity = this.entity;
//         const vector = { x: 0, z: 0, y: -1 };
//         const power = { x: 1, z: 1, y: this.value / 2 };

//         // Skip gravity for entities in water, climbing, or sneaking
//         if (entity.isInWater || entity.isClimbing || entity.isSneaking) {
//             return { x: 0, z: 0, y: 0, hzPower: 0 };
//         }

//         // Handle jump state transitions
//         if (entity.isJumping && playerJumpMap.get(entity)) {
//             playerJumpMap.set(entity, false);
//             const jumpBoost = (entity.getEffect('jump_boost')?.amplifier + 1) || 0;
//             const gravityMod = Math.max(0.1, (9.8 - this.value) / 10 + 1);
//             const lineLength = Math.floor(18 + (9.8 - this.value));
            
//             this.setGravityLine(
//                 Array.from({length: lineLength}, (_, i) => 
//                     (lineLength - i) / 6 * -gravityMod * 5 * 
//                     ((jumpBoost * 0.2) + 1) / Math.max(Math.min(1, this.value), 0.005)
//                 )
//             );
//         } else if (entity.isOnGround) {
//             this.cancelPendingJumps();
//             playerJumpMap.set(entity, true);
//             entity.setDynamicProperty('fall_distance', 0); // Reset fall distance
//         }

//         // Process gravity line
//         if (entity.gravityLine?.[0] !== undefined) {
//             power.y += entity.gravityLine[0];
//             entity.gravityLine.shift();
//         }

//         // Player movement calculations
//         if (entity.typeId === 'minecraft:player') {
//             const movement = entity.inputInfo.getMovementVector();
//             const viewDir = entity.getViewDirection();
//             const rotatedDir = getDirectionFromRotation(
//                 sumObjects(entity.getRotation(), { y: 90 })
//             );
            
//             vector.x = viewDir.x * movement.y - rotatedDir.x * movement.x;
//             vector.z = viewDir.z * movement.y - rotatedDir.z * movement.x;
//         }

//         // Calculate final forces
//         return {
//             x: vector.x,
//             z: vector.z,
//             y: power.y * vector.y,
//             hzPower: this.calculateHorizontalPower(entity)
//         };
//     }

//     // Apply knockback with resistance and mace damage
//     applyKnockbackWithDamage(entity, vector, power) {
//         const knockbackResistance = entity.getEffect('knockback_resistance')?.amplifier || 0;
//         const resistanceFactor = 1 - Math.min(1, knockbackResistance * 1.2); // 20% reduction per level

//         // Adjust knockback power based on resistance
//         const adjustedPower = {
//             x: vector.x * power.hzPower * resistanceFactor,
//             z: vector.z * power.hzPower * resistanceFactor,
//             y: vector.y * power.y * resistanceFactor
//         };

//         // Apply knockback
//         entity.applyKnockback(adjustedPower.x, adjustedPower.z, adjustedPower.hzPower, adjustedPower.y);
//     }

//     // Smooth jump implementation with proper cleanup
//     applyJump() {
//         const entity = this.entity;
//         if (!entity.isOnGround || entity.isInWater || entity.isClimbing || entity.isSneaking) return;

//         this.cancelPendingJumps();
//         jumpStartY.set(entity, entity.location.y);

//         const jumpHeight = this.calculateJumpHeight();
//         const initialPower = Math.sqrt(2 * this.value * jumpHeight) / 20;
        
//         const executeJumpStep = (step) => {
//             if (entity.isOnGround || step >= 20) {
//                 pendingJumpSteps.delete(entity);
//                 return;
//             }

//             const progress = Math.sin((step / 20) * Math.PI);
//             entity.applyKnockback(0, 0, 0, initialPower * progress);

//             const timeoutId = system.runTimeout(() => executeJumpStep(step + 1), 1);
//             pendingJumpSteps.set(entity, timeoutId);
//         };

//         executeJumpStep(0);
//     }
//     cancelPendingJumps() {
//         const timeoutId = pendingJumpSteps.get(this.entity);
//         if (timeoutId) {
//             system.clearRun(timeoutId);
//             pendingJumpSteps.delete(this.entity);
//         }
//     }
// }

// // Runs gravity calculations at regular intervals for all players in the world
// system.runInterval(() => {
//     for (let dimension of DimensionTypes.getAll().map(type => world.getDimension(type.typeId))) {
//         for (let entity of dimension.getEntities({ type: 'player' })) {
//             gravityFuncMain(entity);
//         }
//     }
// });


// // Mace damage system
// world.afterEvents.entityHitEntity.subscribe((event) => {
//     const { damagingEntity, hitEntity } = event;
    
//     if (damagingEntity?.typeId === 'minecraft:player') {
//         const inventory = damagingEntity.getComponent('minecraft:inventory').container;
//         const selectedItem = inventory.getItem(damagingEntity.selectedSlot);
        
//         if (selectedItem?.typeId === 'minecraft:mace') {
//             const fallDistance = damagingEntity.getDynamicProperty('fall_distance') || 0;
//             const damage = Math.max(0, Math.floor(fallDistance * 3 - 3));
            
//             hitEntity.applyDamage(damage);
//             damagingEntity.setDynamicProperty('fall_distance', 0);
            
//             // Visual feedback
//             hitEntity.playAnimation('animation.hurt');
//             damagingEntity.playSound('random.orb');
//         }
//     }
// });

// // MAIN GRAVITY PROCESSING// MAIN GRAVITY PROCESSING
// function gravityFuncMain(entity) {
//     const gravity = new Gravity(entity);
    
//     // Skip processing if:
//     // 1. Default gravity
//     // 2. Entity is flying
//     if (Math.abs(gravity.value - 9.8) < 0.0001 || entity.isFlying) {
//         return;
//     }

//     const vector = gravity.calculateGravityVector();
//     const currentFall = fallVelocity.get(entity) || 0;

//     if (!entity.isOnGround && 
//         !entity.isClimbing && 
//         !entity.isInWater && 
//         !entity.isSneaking) {
//         applyGravityEffects(entity, vector, currentFall, gravity.value);
//     } else {
//         resetFallVelocity(entity);
//         gravity.cancelPendingJumps();
//     }
// }

// async function applyGravityEffects(entity, vector, currentFall, gravityValue) {
//     const fallModifier = Math.min(0, currentFall);
//     const knockbackPower = (vector.y * 2 + fallModifier) / 40;
    
//     entity.applyKnockback(vector.x, vector.z, vector.hzPower, knockbackPower);
//     fallVelocity.set(entity, currentFall - gravityValue / 50);

//     await delay(2);
//     if (entity.getComponent('minecraft:health')?.current > 0) { // Check if entity is valid
//         entity.addEffect('slow_falling', 1, { 
//             amplifier: 1, 
//             showParticles: false 
//         });
//     }
// }

// // Function to reset the fall velocity for the entity when on the ground
// function resetFallVelocity(entity) {
//     fallVelocity.set(entity, 0);
//     entity.setDynamicProperty('fall_distance', 0); // Reset fall distance
// }

// // Utility function to sum vector components
// function sumObjects(objects, vector = undefined, multi = 1) {
//     return {
//         x: (objects.x || 0) + (vector.x || 0) * multi,
//         y: (objects.y || 0) + (vector.y || 0) * multi,
//         z: (objects.z || 0) + (vector.z || 0) * multi
//     };
// }

// // Function to get movement direction from rotation
// function getDirectionFromRotation(rotation) {
//     let angle = {
//         x: (rotation.y + 90) / 57.2958, // Convert degrees to radians
//         y: (rotation.x + 90) / 57.2958
//     };
//     let point = {
//         x: Math.cos(angle.x), // Calculate x component
//         y: Math.cos(angle.y), // Calculate y component
//         z: Math.sin(angle.x)  // Calculate z component
//     };
//     return point; // Return direction vector
// }

// function delay(ticks) {
//     return new Promise(res => system.runTimeout(res, ticks * 20));
// }

// let jumpStartY = new WeakMap();
// const pendingJumpSteps = new WeakMap();
// const playerJumpMap = new WeakMap();
// const fallVelocity = new WeakMap();

