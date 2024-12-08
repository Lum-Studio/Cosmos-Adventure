"use strict";
const mc = require("@minecraft/server");

class EntityCustomComponentFilter {
    constructor() {
        this.types = undefined;
        this.tags = undefined;
        this.nameTags = undefined;
    }
}

class EntityCCOnHitBlockData {
    constructor(block, permutation, face) {
        this.block = block;
        this.permutation = permutation;
        this.face = face;
    }
}

/**
 * Called when Entity hits a block. Contains information about the entity and the block that was hit.
 */
class EntityCCOnHitBlock {
    constructor(entity, blockData) {
        this.entity = entity;
        this.blockData = blockData;
    }
}

/**
 * Called every tick. Contains information about the entity.
 */
class EntityCCOnTick {
    constructor(entity) {
        this.entity = entity;
    }
}

/**
 * Called when the entity hits another entity. Contains information about both the entities.
 */
class EntityCCOnHitEntity {
    constructor(entity, hitEntity) {
        this.entity = entity;
        this.hitEntity = hitEntity;
    }
}

/**
 * Called when entity is being hurt. Contains information about the entity.
 */
class EntityCCOnHurt {
    constructor(entity, damage) {
        this.entity = entity;
        this.damage = damage;
    }
}

/**
 * Contains information about the damage dealt.
 */
class EntityCCDamage {
    constructor(amount, source) {
        this.amount = amount;
        this.source = source;
    }
}

/**
 * Called when entity dies. Contains information about the entity.
 */
class EntityCCOnDie {
    constructor(entity) {
        this.entity = entity;
    }
}

/**
 * Called when entity's health value is changed. Contains information about the entity and the entity's health.
 */
class EntityCCOnHealthChanged {
    constructor(entity, values) {
        this.entity = entity;
        this.values = values;
    }
}

/**
 * Called when entity is being loaded. Contains information about the entity.
 */
class EntityCCOnLoad {
    constructor(entity) {
        this.entity = entity;
    }
}

/**
 * Called when entity is being removed. Contains some information about the entity.
 */
class EntityCCOnRemove {
    constructor(entityRuntimeId, entityTypeId) {
        this.entityRuntimeId = entityRuntimeId;
        this.entityTypeId = entityTypeId;
    }
}

/**
 * Called when entity is spawned. Contains information about the way entity spawned and the entity.
 */
class EntityCCOnSpawn {
    constructor(cause, entity) {
        this.cause = cause;
        this.entity = entity;
    }
}

/**
 * Called when a player interacts with the entity. Contains information about interaction.
 */
class EntityCCOnInteract {
    constructor(player, entity, itemStackBeforeInteraction, itemStackAfterInteraction) {
        this.player = player;
        this.entity = entity;
        this.itemStackBeforeInteraction = itemStackBeforeInteraction;
        this.itemStackAfterInteraction = itemStackAfterInteraction;
    }
}

/**
 * Called when a data driven event is triggered (an event in entity's JSON definition). Contains information about the entity and the event.
 */
class EntityCCOnDataDrivenEventTrigger {
    constructor(entity, eventId, modifiers) {
        this.entity = entity;
        this.eventId = eventId;
        this.modifiers = modifiers;
    }
}

/**
 * Called when a projectile hits the entity. Contains information about the projectile and the entity.
 */
class EntityCCOnProjectileHit {
    constructor(entity, projectileData) {
        this.entity = entity;
        this.projectileData = projectileData;
    }
}

class EntityCCProjectileHitData {
    constructor(projectile, hitVector, location, dimension, source) {
        this.projectile = projectile;
        this.hitVector = hitVector;
        this.location = location;
        this.dimension = dimension;
        this.source = source;
    }
}