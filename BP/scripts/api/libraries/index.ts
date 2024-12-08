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
  
  */
  
  /**
   * Add custom components to Entities
   */
  export interface EntityCustomComponent {
    /**
     * The way to apply the CC. You can use tags, name tags or types.
     */
    filter: EntityCustomComponentFilter;
  
    onHitBlock?: (data: EntityCCOnHitBlock) => void;
  
    /**
     * Called every tick.
     */
    onTick?: (data: EntityCCOnTick) => void;
  
    /**
     * Called when the entity hits another entity.
     */
    onHitEntity?: (data: EntityCCOnHitEntity) => void;
  
    /**
     * Called when the entity is being hurt.
     */
    onHurt?: (data: EntityCCOnHurt) => void;
  
    /**
     * Called when the entity dies.
     */
    onDie?: (data: EntityCCOnDie) => void;
  
    /**
     * Called when the entity's health is changed.
     */
    onHealthChanged?: (data: EntityCCOnHealthChanged) => void;
  
    /**
     * Called when the entity is loaded.
     */
    onLoad?: (data: EntityCCOnLoad) => void;
  
    /**
     * Called when the entity is loaded.
     */
    onRemove?: (data: EntityCCOnRemove) => void;
  
    /**
     * Called when the entity is loaded.
     */
    onSpawn?: (data: EntityCCOnSpawn) => void;
  
    /**
     * Called when a player interacts with the entity.
     */
    onInteract?: (data: EntityCCOnInteract) => void;
  
    /**
     * Called when a player interacts with the entity.
     */
    onDataDrivenEventTrigger?: (data: EntityCCOnDataDrivenEventTrigger) => void;
  
    /**
     * Called when a projectile hits the entity.
     */
    onProjectileHit?: (data: EntityCCOnProjectileHit) => void;
  }
  
  export class EntityCustomComponentRegistry {
    private entityCustomComponents: EntityCustomComponent[] = [];
    private initialized: boolean = false;
  
    /**
     * Use to register `EntityCustomComponent`s.
     */
    public registerCustomComponent(
      component: EntityCustomComponent
    ): EntityCustomComponentRegistry {
      const err = this.handleForErrorsInCustomComponent(component);
      if (err) {
        console.error(err);
        return this;
      }
  
      this.entityCustomComponents.push(component);
      this.init();
      return this;
    }
  
    private init(): void {
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
  
    private handleForErrorsInCustomComponent(
      component: EntityCustomComponent
    ): Error | undefined {
      for (const typeId of component.filter.types ?? []) {
        if (!mc.EntityTypes.get(typeId)) {
          return new Error(
            `Invalid typeId "${typeId}" is in the \`types\` field. The custom component will not be registered.`
          );
        }
      }
      return undefined;
    }
  
    private handleOnTick(): void {
      mc.system.runInterval(() => {
        const cc = this.entityCustomComponents;
  
        const handle = (entity: mc.Entity) => {
          for (const component of cc) {
            if (!component.onTick) return;
            if (
              (!component.filter.types ||
                component.filter.types.includes(entity.typeId)) &&
              (!component.filter.nameTags ||
                component.filter.nameTags.includes(entity.nameTag))
            ) {
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
  
    private handleOnHurt(): void {
      mc.world.afterEvents.entityHurt.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.hurtEntity;
        for (const component of cc) {
          if (!component.onHurt) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
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
  
    private handleOnHitBlock(): void {
      mc.world.afterEvents.entityHitBlock.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.damagingEntity;
        for (const component of cc) {
          if (!component.onHitBlock) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
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
  
    private handleOnHitEntity(): void {
      mc.world.afterEvents.entityHitEntity.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.damagingEntity;
        const hitEntity = data.hitEntity;
        for (const component of cc) {
          if (!component.onHitEntity) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onHitEntity({
              entity,
              hitEntity,
            });
          }
        }
      });
    }
  
    private handleOnDie(): void {
      mc.world.afterEvents.entityDie.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.deadEntity;
        for (const component of cc) {
          if (!component.onDie) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onDie({
              entity,
            });
          }
        }
      });
    }
  
    private handleOnHealthChanged(): void {
      mc.world.afterEvents.entityHealthChanged.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.entity;
        const { oldValue, newValue } = data;
        for (const component of cc) {
          if (!component.onHealthChanged) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onHealthChanged({
              entity,
              values: [oldValue, newValue],
            });
          }
        }
      });
    }
  
    private handleOnLoad(): void {
      mc.world.afterEvents.entityLoad.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.entity;
        for (const component of cc) {
          if (!component.onLoad) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onLoad({
              entity,
            });
          }
        }
      });
    }
  
    private handleOnRemove(): void {
      mc.world.afterEvents.entityRemove.subscribe((data) => {
        const cc = this.entityCustomComponents;
        for (const component of cc) {
          if (!component.onRemove) continue;
          if (
            !component.filter.types ||
            component.filter.types.includes(data.typeId)
          ) {
            component.onRemove({
              entityRuntimeId: data.removedEntityId,
              entityTypeId: data.typeId,
            });
          }
        }
      });
    }
  
    private handleOnSpawn(): void {
      mc.world.afterEvents.entitySpawn.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const { entity, cause } = data;
        for (const component of cc) {
          if (!component.onSpawn) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onSpawn({
              entity,
              cause,
            });
          }
        }
      });
    }
  
    private handleOnInteract(): void {
      mc.world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.target;
        const player = data.player;
        const itemStackBeforeInteraction = data.itemStack;
        let itemStackAfterInteraction: mc.ItemStack | undefined;
        for (const component of cc) {
          if (!component.onInteract) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            mc.system.run(() => {
              itemStackAfterInteraction = (
                player.getComponent("equippable") as mc.EntityEquippableComponent
              ).getEquipment(mc.EquipmentSlot.Mainhand);
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
  
    private handleOnDataDrivenEventTrigger(): void {
      mc.world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.entity;
        const eventId = data.eventId;
        const modifiers = data.getModifiers();
        for (const component of cc) {
          if (!component.onDataDrivenEventTrigger) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onDataDrivenEventTrigger({
              entity,
              eventId,
              modifiers,
            });
          }
        }
      });
    }
  
    private handleOnProjectileHit(): void {
      mc.world.afterEvents.projectileHitEntity.subscribe((data) => {
        const cc = this.entityCustomComponents;
        const entity = data.getEntityHit().entity!;
        const { location, dimension, hitVector, projectile } = data;
        const source = data.source;
        const projectileData: EntityCCProjectileHitData = {
          projectile,
          hitVector,
          dimension,
          location,
          source,
        };
        for (const component of cc) {
          if (!component.onProjectileHit) continue;
          if (
            (!component.filter.types ||
              component.filter.types.includes(entity.typeId)) &&
            (!component.filter.nameTags ||
              component.filter.nameTags.includes(entity.nameTag))
          ) {
            component.onProjectileHit({
              entity,
              projectileData,
            });
          }
        }
      });
    }
  }
  