import { world } from "@minecraft/server";
import { Planet } from "./GalacticraftPlanets";

world.afterEvents.entityHitEntity.subscribe(event => {
  const { damagingEntity, hitEntity } = event;
  if (damagingEntity.dimension.id !== "minecraft:the_end") return;
  const planet = Planet.of(damagingEntity);
  // Ensure the damaging entity is a player.
  if (!damagingEntity || damagingEntity.typeId !== "minecraft:player" || !planet) return;

  // Check if the player is holding a mace.
  const hand = damagingEntity.getComponent("equippable").getEquipmentSlot("Mainhand");
  if (!hand.hasItem() || hand.typeId !== "minecraft:mace") return;

  // Retrieve the fall distance dynamic property.
  const fallDistance = Number(damagingEntity.getDynamicProperty("fall_distance")) || 0;
  let extraDamage = 0;

  if (fallDistance >= 1.5) {
    const extraFall = fallDistance - 1.5;
    // First segment: for the first 3 blocks, +8 damage per block.
    const firstSegment = Math.min(extraFall, 3);
    extraDamage += firstSegment * 8;
    // Second segment: for the next 5 blocks, +2 damage per block.
    const secondSegment = Math.max(0, Math.min(extraFall - 3, 5));
    extraDamage += secondSegment * 2;
    // Third segment: beyond 8 blocks total, +1 damage per block.
    const thirdSegment = Math.max(0, extraFall - 8);
    extraDamage += thirdSegment;
  }

  // Apply the extra damage if the hit entity supports it.
  if (extraDamage > 0 && typeof hitEntity.applyDamage === "function") {
    hitEntity.applyDamage(extraDamage);
  }

  // Reset the fall distance dynamic property on the player.
  if (typeof damagingEntity.setDynamicProperty === "function") {
    damagingEntity.setDynamicProperty("fall_distance", 0);
  }

  // visual feedback.
  if (typeof hitEntity.playAnimation === "function") {
    hitEntity.playAnimation("animation.hurt");
  }
  if (typeof damagingEntity.playSound === "function") {
    damagingEntity.playSound("random.orb");
  }
});

export { }
