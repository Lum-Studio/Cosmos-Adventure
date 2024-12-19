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
  } from "./interfaces";
  
import * as mc from "@minecraft/server";
export class EntityCustomComponentRegistry {
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
        if (this.initialized)
            return;
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
        let _a;
        for (const typeId of (_a = component.filter.types) !== null && _a !== void 0 ? _a : []) {
            if (!mc.EntityTypes.get(typeId)) {
                return new Error(`Invalid typeId "${typeId}" is in the \`types\` field. The custom component will not be registered.`);
            }
        }
        return undefined;
    }
    handleOnTick() {
        mc.system.runInterval(() => {
            const cc = this.entityCustomComponents;
            const handle = (entity) => {
                for (const component of cc) {
                    if (!component.onTick)
                        return;
                    if ((!component.filter.types ||
                        component.filter.types.includes(entity.typeId)) &&
                        (!component.filter.nameTags ||
                            component.filter.nameTags.includes(entity.nameTag))) {
                        component.onTick({
                            entity,
                        });
                    }
                }
            };
            for (const entity of mc.world.getDimension("overworld").getEntities()) {
                handle(entity);
            }
            for (const entity of mc.world.getDimension("nether").getEntities()) {
                handle(entity);
            }
            for (const entity of mc.world.getDimension("the_end").getEntities()) {
                handle(entity);
            }
        });
    }
    handleOnHurt() {
        mc.world.afterEvents.entityHurt.subscribe((data) => {
            const cc = this.entityCustomComponents;
            const entity = data.hurtEntity;
            for (const component of cc) {
                if (!component.onHurt)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
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
                if (!component.onHitBlock)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
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
                if (!component.onHitEntity)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
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
                if (!component.onDie)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
                    component.onDie({
                        entity,
                    });
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
                if (!component.onHealthChanged)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
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
                if (!component.onLoad)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
                    component.onLoad({
                        entity,
                    });
                }
            }
        });
    }
    handleOnRemove() {
        mc.world.afterEvents.entityRemove.subscribe((data) => {
            const cc = this.entityCustomComponents;
            for (const component of cc) {
                if (!component.onRemove)
                    continue;
                if (!component.filter.types ||
                    component.filter.types.includes(data.typeId)) {
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
                if (!component.onSpawn)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
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
                if (!component.onInteract)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
                    mc.system.run(() => {
                        itemStackAfterInteraction = player.getComponent("equippable").getEquipment(mc.EquipmentSlot.Mainhand);
                        if (!component.onInteract)
                            return;
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
                if (!component.onDataDrivenEventTrigger)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
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
                if (!component.onProjectileHit)
                    continue;
                if ((!component.filter.types ||
                    component.filter.types.includes(entity.typeId)) &&
                    (!component.filter.nameTags ||
                        component.filter.nameTags.includes(entity.nameTag))) {
                    component.onProjectileHit({
                        entity,
                        projectileData,
                    });
                }
            }
        });
    }
}

