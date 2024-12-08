"use strict";
exports.__esModule = true;
exports.EntityCustomComponentRegistry = void 0;

const mc = require("@minecraft/server");

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

        // Register all event handlers
        this.registerEventHandlers();
    }

    registerEventHandlers() {
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
        const types = component.filter.types || [];
        for (const typeId of types) {
            if (!mc.EntityTypes.get(typeId)) {
                return new Error(`Invalid typeId "${typeId}" is in the \`types\` field. The custom component will not be registered.`);
            }
        }
        return undefined;
    }

    handleOnTick() {
        mc.system.runInterval(() => {
            this.processEntities(mc.world.getDimension("overworld").getEntities());
            this.processEntities(mc.world.getDimension("nether").getEntities());
            this.processEntities(mc.world.getDimension("the_end").getEntities());
        });
    }

    processEntities(entities) {
        for (const entity of entities) {
            this.entityCustomComponents.forEach(component => {
                if (component.onTick && this.isEntityValid(component, entity)) {
                    component.onTick({ entity });
                }
            });
        }
    }

    isEntityValid(component, entity) {
        return (!component.filter.types || component.filter.types.includes(entity.typeId)) &&
               (!component.filter.nameTags || component.filter.nameTags.includes(entity.nameTag));
    }

    handleOnHurt() {
        mc.world.afterEvents.entityHurt.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onHurt && this.isEntityValid(component, data.hurtEntity)) {
                    component.onHurt({
                        entity: data.hurtEntity,
                        damage: { amount: data.damage, source: data.damageSource }
                    });
                }
            });
        });
    }

    handleOnHitBlock() {
        mc.world.afterEvents.entityHitBlock.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onHitBlock && this.isEntityValid(component, data.damagingEntity)) {
                    component.onHitBlock({
                        entity: data.damagingEntity,
                        blockData: {
                            block: data.hitBlock,
                            permutation: data.hitBlockPermutation,
                            face: data.blockFace
                        }
                    });
                }
            });
        });
    }

    handleOnHitEntity() {
        mc.world.afterEvents.entityHitEntity.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onHitEntity && this.isEntityValid(component, data.damagingEntity)) {
                    component.onHitEntity({
                        entity: data.damagingEntity,
                        hitEntity: data.hitEntity
                    });
                }
            });
        });
    }

    handleOnDie() {
        mc.world.afterEvents.entityDie.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onDie && this.isEntityValid(component, data.deadEntity)) {
                    component.onDie({ entity: data.deadEntity });
                }
            });
        });
    }

    handleOnHealthChanged() {
        mc.world.afterEvents.entityHealthChanged.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onHealthChanged && this.isEntityValid(component, data.entity)) {
                    component.onHealthChanged({
                        entity: data.entity,
                        values: [data.oldValue, data.newValue]
                    });
                }
            });
        });
    }

    handleOnLoad() {
        mc.world.afterEvents.entityLoad.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onLoad && this.isEntityValid(component, data.entity)) {
                    component.onLoad({ entity: data.entity });
                }
            });
        });
    }

    handleOnRemove() {
        mc.world.afterEvents.entityRemove.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onRemove && this.isEntityValidType(component, data.typeId)) {
                    component.onRemove({
                        entityRuntimeId: data.removedEntityId,
                        entityTypeId: data.typeId
                    });
                }
            });
        });
    }

    handleOnSpawn() {
        mc.world.afterEvents.entitySpawn.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onSpawn && this.isEntityValid(component, data.entity)) {
                    component.onSpawn({
                        entity: data.entity,
                        cause: data.cause
                    });
                }
            });
        });
    }

    handleOnInteract() {
        mc.world.beforeEvents.playerInteractWithEntity.subscribe(data => {
            const { target: entity, player, itemStack: itemStackBeforeInteraction } = data;
            this.entityCustomComponents.forEach(component => {
                if (component.onInteract && this.isEntityValid(component, entity)) {
                    mc.system.run(() => {
                        const itemStackAfterInteraction = player.getComponent("equippable").getEquipment(mc.EquipmentSlot.Mainhand);
                        component.onInteract({
                            entity,
                            player,
                            itemStackBeforeInteraction,
                            itemStackAfterInteraction
                        });
                    });
                }
            });
        });
    }

    handleOnDataDrivenEventTrigger() {
        mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(data => {
            this.entityCustomComponents.forEach(component => {
                if (component.onDataDrivenEventTrigger && this.isEntityValid(component, data.entity)) {
                    component.onDataDrivenEventTrigger({
                        entity: data.entity,
                        eventId: data.eventId,
                        modifiers: data.getModifiers()
                    });
                }
            });
        });
    }

    handleOnProjectileHit() {
        mc.world.afterEvents.projectileHitEntity.subscribe(data => {
            const entity = data.getEntityHit().entity;
            const projectileData = {
                projectile: data.projectile,
                hitVector: data.hitVector,
                dimension: data.dimension,
                location: data.location,
                source: data.source
            };
            this.entityCustomComponents.forEach(component => {
                if (component.onProjectileHit && this.isEntityValid(component, entity)) {
                    component.onProjectileHit({
                        entity,
                        projectileData
                    });
                }
            });
        });
    }

    isEntityValidType(component, typeId) {
        return !component.filter.types || component.filter.types.includes(typeId);
    }
}

exports.EntityCustomComponentRegistry = EntityCustomComponentRegistry;