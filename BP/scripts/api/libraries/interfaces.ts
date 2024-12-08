import * as mc from "@minecraft/server";

export interface EntityCustomComponentFilter {
  types?: string[];
  tags?: string[];
  nameTags?: string[];
}

export interface EntityCCOnHitBlockData {
  block: mc.Block;
  permutation: mc.BlockPermutation;
  face: mc.Direction;
}

/**
 * Called when Entity hits a block. Contains information about the entity and the block that was hit.
 */
export interface EntityCCOnHitBlock {
  entity: mc.Entity;
  blockData: EntityCCOnHitBlockData;
}

/**
 * Called every tick. Contains information about the entity.
 */
export interface EntityCCOnTick {
  entity: mc.Entity;
}

/**
 * Called when the entity hits another entity. Contains information about both the entities.
 */
export interface EntityCCOnHitEntity {
  entity: mc.Entity;
  hitEntity: mc.Entity;
}

/**
 * Called when entity is being hurt. Contains information about the entity.
 */
export interface EntityCCOnHurt {
  entity: mc.Entity;
  damage: EntityCCDamage;
}

/**
 * Contains information about the damage dealt.
 */
export interface EntityCCDamage {
  amount: number;
  source: mc.EntityDamageSource;
}

/**
 * Called when entity dies. Contains information about the entity.
 */
export interface EntityCCOnDie {
  entity: mc.Entity;
}

/**
 * Called when entity's health value is changed. Contains information about the entity and the entity's health.
 */
export interface EntityCCOnHealthChanged {
  entity: mc.Entity;
  values: [number, number];
}

/**
 * Called when entity is being loaded. Contains information about the entity.
 */
export interface EntityCCOnLoad {
  entity: mc.Entity;
}

/**
 * Called when entity is being removed. Contains some information about the entity.
 */
export interface EntityCCOnRemove {
  /**
   * Is actually a bigint.
   */
  entityRuntimeId: string;
  entityTypeId: string;
}

/**
 * Called when entity is spawned. Conaints information about the way entity spawned and the entity.
 */
export interface EntityCCOnSpawn {
  cause: mc.EntityInitializationCause;
  entity: mc.Entity;
}

/**
 * Called when entity is spawned. Conaints information about the way entity spawned and the entity.
 */
export interface EntityCCOnInteract {
  player: mc.Player;
  entity: mc.Entity;
  itemStackBeforeInteraction?: mc.ItemStack;
  itemStackAfterInteraction?: mc.ItemStack;
}

/**
 * Called when a data driven event is triggered(an event in entity's JSON definition). Contains information about the entity and the event.
 */
export interface EntityCCOnDataDrivenEventTrigger {
  entity: mc.Entity;
  eventId: string;
  modifiers: mc.DefinitionModifier[];
}

/**
 * Called when a projectile hits the entity. Contains information about the projectile and the entity.
 */
export interface EntityCCOnProjectileHit {
  entity: mc.Entity;
  projectileData: EntityCCProjectileHitData;
}

export interface EntityCCProjectileHitData {
  projectile: mc.Entity;
  hitVector: mc.Vector3;
  location: mc.Vector3;
  dimension: mc.Dimension;
  source?: mc.Entity;
}
