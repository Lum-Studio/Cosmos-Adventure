import * as MC from '@minecraft/server';
import * as UI from '@minecraft/server-ui';


declare module "@minecraft/server" {

    interface World {
        getDimension<T extends keyof dimensionIds>(dimensionId: T): Dimension;
        getDims(fn?: () => {}): Dimension[];
    }

    interface ItemStack {
        decrementStack(amount?: number): ItemStack;
        incrementStack(amount?: number): ItemStack;
    }

    interface Player {
        give(itemType: string, amount?: 1, data?: 0): void;
    }

    interface Entity {
        hasComponent<T extends keyof EntityComponents>(componentId: T): boolean;
    }

    interface InputInfo {
        getButtonState<T extends keyof typeof InputButton>(button: T): ButtonState;
    }

    interface EntityEquippableComponent {
        getEquipment<T extends keyof typeof EquipmentSlot>(slot: T): ItemStack;
        getEquipmentSlot<T extends keyof typeof EquipmentSlot>(slot: T): ContainerSlot;
    }

    interface Block {
        four_neighbors(sides: string[]): { [T: string]: Block } | {};
        six_neighbors(): { [T: string]: Block };
        getNeighbors(maxSearch: 27): Block[];
        hasComponent<T extends keyof BlockComponents>(componentId: T): boolean;
    }

    interface ItemStack {
        hasComponent<T extends keyof ItemComponents>(componentId: T): boolean;
    }

    interface Container {
        updateUI(uiConfigs: [], data: any): void;
        add_ui_button(slot: number, text: string, lore: string[]): void
        add_ui_display(slot: number, text: string, damage: number): void
    }

    interface EntityEquipmentInventoryComponent {
        getEquipmentSlot<T extends keyof typeof EquipmentSlot>(equipmentSlot: T): ContainerSlot
        getEquipment<T extends keyof typeof EquipmentSlot>(equipmentSlot: T): ItemStack
    }

}



interface dimensionIds { the_end: string, nether: string, overworld: string }
interface BlockComponents {
    "inventory": MC.BlockInventoryComponent,
    "minecraft:inventory": MC.BlockInventoryComponent,
    "fluidContainer": MC.BlockFluidContainerComponent,
    "minecraft:fluidContainer": MC.BlockFluidContainerComponent,
    "piston": MC.BlockPistonComponent,
    "minecraft:piston": MC.BlockPistonComponent,
    "recordPlayer": MC.BlockRecordPlayerComponent,
    "minecraft:recordPlayer": MC.BlockRecordPlayerComponent,
    "sign": MC.BlockSignComponent,
    "minecraft:sign": MC.BlockSignComponent,
}
interface EntityComponents {
    "addrider": MC.EntityAddRiderComponent,
    "minecraft:addrider": MC.EntityAddRiderComponent,
    "ageable": MC.EntityAgeableComponent,
    "minecraft:ageable": MC.EntityAgeableComponent,
    "breathable": MC.EntityBreathableComponent,
    "minecraft:breathable": MC.EntityBreathableComponent,
    "can_climb": MC.EntityCanClimbComponent,
    "minecraft:can_climb": MC.EntityCanClimbComponent,
    "can_fly": MC.EntityCanFlyComponent,
    "minecraft:can_fly": MC.EntityCanFlyComponent,
    "can_power_jump": MC.EntityCanPowerJumpComponent,
    "minecraft:can_power_jump": MC.EntityCanPowerJumpComponent,
    "color": MC.EntityColorComponent,
    "minecraft:color": MC.EntityColorComponent,
    "equippable": MC.EntityEquippableComponent,
    "minecraft:equippable": MC.EntityEquippableComponent,
    "fire_immune": MC.EntityFireImmuneComponent,
    "minecraft:fire_immune": MC.EntityFireImmuneComponent,
    "floats_in_liquid": MC.EntityFloatsInLiquidComponent,
    "minecraft:floats_in_liquid": MC.EntityFloatsInLiquidComponent,
    "flying_speed": MC.EntityFlyingSpeedComponent,
    "minecraft:flying_speed": MC.EntityFlyingSpeedComponent,
    "friction_modifier": MC.EntityFrictionModifierComponent,
    "minecraft:friction_modifier": MC.EntityFrictionModifierComponent,
    "ground_offset": MC.EntityGroundOffsetComponent,
    "minecraft:ground_offset": MC.EntityGroundOffsetComponent,
    "healable": MC.EntityHealableComponent,
    "minecraft:healable": MC.EntityHealableComponent,
    "health": MC.EntityHealthComponent,
    "minecraft:health": MC.EntityHealthComponent,
    "inventory": MC.EntityInventoryComponent,
    "minecraft:inventory": MC.EntityInventoryComponent,
    "is_baby": MC.EntityIsBabyComponent,
    "minecraft:is_baby": MC.EntityIsBabyComponent,
    "is_chested": MC.EntityIsChestedComponent,
    "minecraft:is_chested": MC.EntityIsChestedComponent,
    "is_dyeable": MC.EntityIsDyeableComponent,
    "minecraft:is_dyeable": MC.EntityIsDyeableComponent,
    "is_hidden_when_invisible": MC.EntityIsHiddenWhenInvisibleComponent,
    "minecraft:is_hidden_when_invisible": MC.EntityIsHiddenWhenInvisibleComponent,
    "is_ignited": MC.EntityIsIgnitedComponent,
    "minecraft:is_ignited": MC.EntityIsIgnitedComponent,
    "is_illager_captain": MC.EntityIsIllagerCaptainComponent,
    "minecraft:is_illager_captain": MC.EntityIsIllagerCaptainComponent,
    "is_saddled": MC.EntityIsSaddledComponent,
    "minecraft:is_saddled": MC.EntityIsSaddledComponent,
    "is_shaking": MC.EntityIsShakingComponent,
    "minecraft:is_shaking": MC.EntityIsShakingComponent,
    "is_sheared": MC.EntityIsShearedComponent,
    "minecraft:is_sheared": MC.EntityIsShearedComponent,
    "is_stackable": MC.EntityIsStackableComponent,
    "minecraft:is_stackable": MC.EntityIsStackableComponent,
    "is_stunned": MC.EntityIsStunnedComponent,
    "minecraft:is_stunned": MC.EntityIsStunnedComponent,
    "is_tamed": MC.EntityIsTamedComponent,
    "minecraft:is_tamed": MC.EntityIsTamedComponent,
    "item": MC.EntityItemComponent,
    "minecraft:item": MC.EntityItemComponent,
    "lava_movement": MC.EntityLavaMovementComponent,
    "minecraft:lava_movement": MC.EntityLavaMovementComponent,
    "leashable": MC.EntityLeashableComponent,
    "minecraft:leashable": MC.EntityLeashableComponent,
    "mark_variant": MC.EntityMarkVariantComponent,
    "minecraft:mark_variant": MC.EntityMarkVariantComponent,
    "tamemount": MC.EntityTameMountComponent,
    "minecraft:tamemount": MC.EntityTameMountComponent,
    "movement.amphibious": MC.EntityMovementAmphibiousComponent,
    "minecraft:movement.amphibious": MC.EntityMovementAmphibiousComponent,
    "movement.basic": MC.EntityMovementBasicComponent,
    "minecraft:movement.basic": MC.EntityMovementBasicComponent,
    "movement": MC.EntityMovementComponent,
    "minecraft:movement": MC.EntityMovementComponent,
    "movement.fly": MC.EntityMovementFlyComponent,
    "minecraft:movement.fly": MC.EntityMovementFlyComponent,
    "movement.generic": MC.EntityMovementGenericComponent,
    "minecraft:movement.generic": MC.EntityMovementGenericComponent,
    "movement.glide": MC.EntityMovementGlideComponent,
    "minecraft:movement.glide": MC.EntityMovementGlideComponent,
    "movement.hover": MC.EntityMovementHoverComponent,
    "minecraft:movement.hover": MC.EntityMovementHoverComponent,
    "movement.jump": MC.EntityMovementJumpComponent,
    "minecraft:movement.jump": MC.EntityMovementJumpComponent,
    "movement.skip": MC.EntityMovementSkipComponent,
    "minecraft:movement.skip": MC.EntityMovementSkipComponent,
    "movement.sway": MC.EntityMovementSwayComponent,
    "minecraft:movement.sway": MC.EntityMovementSwayComponent,
    "navigation.climb": MC.EntityNavigationClimbComponent,
    "minecraft:navigation.climb": MC.EntityNavigationClimbComponent,
    "navigation.float": MC.EntityNavigationFloatComponent,
    "minecraft:navigation.float": MC.EntityNavigationFloatComponent,
    "navigation.fly": MC.EntityNavigationFlyComponent,
    "minecraft:navigation.fly": MC.EntityNavigationFlyComponent,
    "navigation.generic": MC.EntityNavigationGenericComponent,
    "minecraft:navigation.generic": MC.EntityNavigationGenericComponent,
    "navigation.hover": MC.EntityNavigationHoverComponent,
    "minecraft:navigation.hover": MC.EntityNavigationHoverComponent,
    "navigation.walk": MC.EntityNavigationWalkComponent,
    "minecraft:navigation.walk": MC.EntityNavigationWalkComponent,
    "onfire": MC.EntityOnFireComponent,
    "minecraft:onfire": MC.EntityOnFireComponent,
    "push_through": MC.EntityPushThroughComponent,
    "minecraft:push_through": MC.EntityPushThroughComponent,
    "rideable": MC.EntityRideableComponent,
    "minecraft:rideable": MC.EntityRideableComponent,
    "riding": MC.EntityRidingComponent,
    "minecraft:riding": MC.EntityRidingComponent,
    "scale": MC.EntityScaleComponent,
    "minecraft:scale": MC.EntityScaleComponent,
    "skin_id": MC.EntitySkinIdComponent,
    "minecraft:skin_id": MC.EntitySkinIdComponent,
    "strength": MC.EntityStrengthComponent,
    "minecraft:strength": MC.EntityStrengthComponent,
    "tameable": MC.EntityTameableComponent,
    "minecraft:tameable": MC.EntityTameableComponent,
    "underwater_movement": MC.EntityUnderwaterMovementComponent,
    "minecraft:underwater_movement": MC.EntityUnderwaterMovementComponent,
    "variant": MC.EntityVariantComponent,
    "minecraft:variant": MC.EntityVariantComponent,
    "wants_jockey": MC.EntityWantsJockeyComponent,
    "minecraft:wants_jockey": MC.EntityWantsJockeyComponent
}

interface ItemComponents {
    "cooldown": MC.ItemCooldownComponent,
    "minecraft:cooldown": MC.ItemCooldownComponent,
    "durability": MC.ItemDurabilityComponent,
    "minecraft:durability": MC.ItemDurabilityComponent,
    "enchantable": MC.ItemEnchantableComponent,
    "minecraft:enchantable": MC.ItemEnchantableComponent,
    "food": MC.ItemFoodComponent,
    "minecraft:food": MC.ItemFoodComponent,
}