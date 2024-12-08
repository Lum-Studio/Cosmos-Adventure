"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityCustomComponentRegistry = void 0;
const mc = require("@minecraft/server");

import {
    EntityCCOnDie,
    EntityCCOnHealthChanged,
    EntityCCOnHitBlock,
    EntityCCOnHitEntity,
    EntityCCOnHurt,
    EntityCCOnLoad,
    EntityCCOnRemove,
    EntityCCOnSpawn,
    EntityCCOnTick,
    EntityCCOnInteract,
    EntityCustomComponentFilter,
    EntityCCOnDataDrivenEventTrigger,
    EntityCCOnProjectileHit,
    EntityCCProjectileHitData,
  } from "./interfaces.js";
  import * as mc from "@minecraft/server";
  
/*
TODO LIST

[x] onHitBlock
[x] onHitEntity
[x] onHurt
[x] onTick
[x] onDie
[x] onHealthChanged
[x] onLoad
[x] onRemove
[x] onSpawn
[x] onInteract
[x] onDataDrivenEventTrigger
[x] onProjectileHit


"use strict";
const mc = require("@minecraft/server");

/**
 * Add custom components to Entities
 */
class EntityCustomComponent {
    /**
     * The way to apply the CC. You can use tags, name tags or types.
     */
    constructor(filter) {
        this.filter = filter;
    }

    /**
     * Called when the entity hits a block. Contains information about the entity and the block that was hit.
     */
    onHitBlock(data) {
        // Optional implementation
    }

    /**
     * Called every tick.
     */
    onTick(data) {
        // Optional implementation
    }

    /**
     * Called when the entity hits another entity.
     */
    onHitEntity(data) {
        // Optional implementation
    }

    /**
     * Called when the entity is being hurt.
     */
    onHurt(data) {
        // Optional implementation
    }

    /**
     * Called when the entity dies.
     */
    onDie(data) {
        // Optional implementation
    }

    /**
     * Called when the entity's health is changed.
     */
    onHealthChanged(data) {
        // Optional implementation
    }

    /**
     * Called when the entity is loaded.
     */
    onLoad(data) {
        // Optional implementation
    }

    /**
     * Called when the entity is removed.
     */
    onRemove(data) {
        // Optional implementation
    }

    /**
     * Called when the entity is spawned.
     */
    onSpawn(data) {
        // Optional implementation
    }

    /**
     * Called when a player interacts with the entity.
     */
    onInteract(data) {
        // Optional implementation
    }

    /**
     * Called when a data driven event is triggered (an event in entity's JSON definition).
     * Contains information about the entity and the event.
     */
    onDataDrivenEventTrigger(data) {
        // Optional implementation
    }

    /**
     * Called when a projectile hits the entity.
     */
    onProjectileHit(data) {
        // Optional implementation
    }
}


/**
 * Add custom components to Entities
 */
class EntityCustomComponentRegistry {
    constructor() {
        this.entityCustomComponents = [];
        this.initialized = false;
    }

    /**
     * Use to register `EntityCustomComponent`s.
     */
    registerCustomComponent(component) {
        const err = this.handleForErrorsInCustomComponent(component);
        if (err) {
            console.error(err);
            return this;
        }

        this.entityCustomComponents.push(component);
        this.init();
        return this;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.handleOnTick();
        this.handleOnHurt();
        this.handleOnHitBlock();
        this.handleOnHitEntity();
        this.handleOnDie();
        this.handleOnHealthChanged();
        this.handleOnLoad();
        this.handleOnRemove();
        this.handleOnSpawn();
        this.handleOnInteract();
        this.handleOnDataDrivenEventTrigger();
        this.handleOnProjectileHit();
    }

    handleForErrorsInCustomComponent(component) {
        for (const typeId of component.filter.types || []) {
            if (!mc.EntityTypes.get(typeId)) {
                return new Error(`Invalid typeId "${typeId}" is in the 'types' field.`);
            }
        }
        return undefined;
    }

    handleOnTick() {
        mc.system.runInterval(() => {
            const cc = this.entityCustomComponents;

            const handle = (entity) => {
                for (const component of cc) {
                    if (!component.onTick) return;
                    if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                        (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                        component.onTick({ entity });
                    }
                }
            };

            for (const dimension of ["overworld", "nether", "the_end"]) {
                for (const entity of mc.world.getDimension(dimension).getEntities()) {
                    handle(entity);
                }
            }
        });
    }

    handleOnHurt() {
        mc.world.afterEvents.entityHurt.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.hurtEntity;
            for (const component of cc) {
                if (!component.onHurt) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onHurt({
                        entity,
                        damage: {
                            amount: data.damage,
                            source: data.damageSource,
                        },
                    });
                }
            }
        });
    }

    handleOnHitBlock() {
        mc.world.afterEvents.entityHitBlock.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.damagingEntity;
            for (const component of cc) {
                if (!component.onHitBlock) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onHitBlock({
                        entity,
                        blockData: {
                            block: data.hitBlock,
                            permutation: data.hitBlockPermutation,
                            face: data.blockFace,
                        },
                    });
                }
            }
        });
    }

    handleOnHitEntity() {
        mc.world.afterEvents.entityHitEntity.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.damagingEntity;
            const hitEntity = data.hitEntity;
            for (const component of cc) {
                if (!component.onHitEntity) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onHitEntity({
                        entity,
                        hitEntity,
                    });
                }
            }
        });
    }

    handleOnDie() {
        mc.world.afterEvents.entityDie.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.deadEntity;
            for (const component of cc) {
                if (!component.onDie) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onDie({ entity });
                }
            }
        });
    }

    handleOnHealthChanged() {
        mc.world.afterEvents.entityHealthChanged.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.entity;
            const { oldValue, newValue } = data;
            for (const component of cc) {
                if (!component.onHealthChanged) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onHealthChanged({
                        entity,
                        values: [oldValue, newValue],
                    });
                }
            }
        });
    }

    handleOnLoad() {
        mc.world.afterEvents.entityLoad.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.entity;
            for (const component of cc) {
                if (!component.onLoad) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onLoad({ entity });
                }
            }
        });
    }

    handleOnRemove() {
        mc.world.afterEvents.entityRemove.subscribe((data) => {
            const cc = this.entityCustomComponents;
            for (const component of cc) {
                if (!component.onRemove) continue;
                if (!component.filter.types || component.filter.types.includes(data.typeId)) {
                    component.onRemove({
                        entityRuntimeId: data.removedEntityId,
                        entityTypeId: data.typeId,
                    });
                }
            }
        });
    }

    handleOnSpawn() {
        mc.world.afterEvents.entitySpawn.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const { entity, cause } = data;
            for (const component of cc) {
                if (!component.onSpawn) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onSpawn({
                        entity,
                        cause,
                    });
                }
            }
        });
    }

    handleOnInteract() {
        mc.world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.target;
            const player = data.player;
            const itemStackBeforeInteraction = data.itemStack;
            let itemStackAfterInteraction;
            for (const component of cc) {
                if (!component.onInteract) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    mc.system.run(() => {
                        itemStackAfterInteraction = player.getComponent("equippable").getEquipment(mc.EquipmentSlot.Mainhand);
                        if (!component.onInteract) return;
                        component.onInteract({
                            entity,
                            player,
                            itemStackBeforeInteraction,
                            itemStackAfterInteraction,
                        });
                    });
                }
            }
        });
    }

    handleOnDataDrivenEventTrigger() {
        mc.world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.entity;
            const eventId = data.eventId;
            const modifiers = data.getModifiers();
            for (const component of cc) {
                if (!component.onDataDrivenEventTrigger) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onDataDrivenEventTrigger({
                        entity,
                        eventId,
                        modifiers,
                    });
                }
            }
        });
    }

    handleOnProjectileHit() {
        mc.world.afterEvents.projectileHitEntity.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.getEntityHit().entity;
            const { location, dimension, hitVector, projectile } = data;
            const source = data.source;
            const projectileData = {
                projectile,
                hitVector,
                dimension,
                location,
                source,
            };
            for (const component of cc) {
                if (!component.onProjectileHit) continue;
                if ((!component.filter.types || component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag))) {
                    component.onProjectileHit({
                        entity,
                        projectileData,
                    });
                }
            }
        });
    }
}

exports.EntityCustomComponentRegistry = EntityCustomComponentRegistry;