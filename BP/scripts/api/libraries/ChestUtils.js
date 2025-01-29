import { system, world, ItemStack } from "@minecraft/server";

export class ChestUtils {
    constructor(chest_entity) {
        // Initialize the chest entity and set up parameters for interaction
        this.chest_entity = chest_entity; // The chest entity being managed
        this.lockedState = 'locked'; // State indicating the chest is locked
        this.unlockedState = 'unlocked'; // State indicating the chest is unlocked
    }

    /**
     * Handles player interaction with the chest.
     * @param {Object} player - The player interacting with the chest.
     * @returns {void}
     */
    interact(player) {
        const { chest_entity } = this;
        const chest = chest_entity.permutation; // Get the chest's permutation
        const equipment = player.getComponent("minecraft:equippable"); // Get the player's equipment
        const item = equipment.getEquipment("Mainhand"); // Get the item in the player's main hand

        // Check if the chest is locked
        if (chest.getState('cosmos:chest_state') !== this.lockedState) return;

        // Extract tier from the chest type ID
        const tier = +(chest_entity.typeId.replace('cosmos:tier', '').replace('_treasure_chest', ''));

        // Validate the item used to unlock the chest
        if (tiers[item?.typeId] !== chest_entity.typeId) {
            hint(player, tier); // Provide feedback to the player
            return;
        }

        // Place the treasure structure
        world.structureManager.place(`treasures/tier${tier}`, chest_entity.dimension, chest_entity.location);

        // Generate loot for the chest
        system.run(() => {
            const entity = chest_entity.dimension.getEntities({ type: "cosmos:treasure_chest", closest: 1, location: chest_entity.bottomCenter() })[0];
            if (!entity) return;
            const loot = entity.getComponent('inventory').container; // Get the chest's inventory
            const slot = Math.floor(Math.random() * 27); // Random slot in the inventory
            const reward = select_random_item(rewards[tier - 1]); // Select a random reward
            loot.setItem(slot, new ItemStack(reward)); // Set the reward in the loot
        });

        // Update the chest state to unlocked
        chest_entity.setPermutation(chest.withState('cosmos:chest_state', this.unlockedState));

        // Remove the item used to unlock the chest if not in creative mode
        if (player.getGameMode() !== 'creative') {
            player.runCommand(`clear @s ${item.typeId} 0 1`);
        }
    }
    /**
     * Opens the chest and plays the opening sound with animation.
     * @returns {void}
     */
    open() {
        const { chest_entity, maxOpen, cooldown } = this;
        const { dimension, location } = chest_entity; // Extract the dimension and location of the chest

        // Play the chest opening sound
        dimension.playSound('random.chestopen', location);
        // Set the chest's dynamic property to indicate it is open
        chest_entity.setDynamicProperty('isOpen', true);

        // Start an interval to animate the chest opening
        this.interval = system.runInterval(() => {
            const chestState = chest_entity.permutation.getState('custom:open'); // Get current open state
            const nextChestState = chest_entity.permutation.withState('custom:open', chestState + 1); // Increment state
            chest_entity.setPermutation(nextChestState); // Update the chest's state

            // Clear the interval if the max open state is reached
            if ((chestState + 1) >= maxOpen) {
                system.clearRun(this.interval);
            }
        }, cooldown);
    }

    /**
     * Closes the chest if it is currently open.
     * @returns {void}
     */
    close() {
        const { chest_entity } = this;
        const chest = chest_entity.permutation;

        // Check if the chest is currently open
        if (!chest_entity.getDynamicProperty('isOpen')) return; // Exit if it is not open

        const dimension = chest_entity.dimension; // Extract dimension
        const location = chest_entity.location; // Extract location

        // Play the chest closing sound
        dimension.playSound('random.chestclosed', location);
        // Set the chest's dynamic property to indicate it is closed
        chest_entity.setDynamicProperty('isOpen', false);

        // Start an interval to animate the chest closing
        this.interval = system.runInterval(() => {
            const chestState = chest_entity.permutation.getState('open'); // Get current open state
            const nextChestState = chest_entity.permutation.withState('open', Math.max(chestState - 1, 0)); // Decrement state
            chest_entity.setPermutation(nextChestState); // Update the chest's state

            // Clear the interval if the chest is fully closed
            if (chestState <= 0) {
                system.clearRun(this.interval);
            }
        }, this.cooldown);
    }
}