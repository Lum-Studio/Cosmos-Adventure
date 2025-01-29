import { system } from "@minecraft/server";

export class TreasureChest {
    constructor(chest_entity) {
        // Initialize the chest entity and set up parameters for opening/closing
        this.chest_entity = chest_entity; // The chest entity being managed
        this.maxOpen = 5; // Maximum times the chest can be opened
        this.cooldown = 1; // Cooldown time between opening actions
        this.interval = 0; // Interval for the opening animation
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
        const chest = chest_entity.permutation;

        // Check if the chest is locked
        if (chest.getState('cosmos:chest_state') !== this.lockedState) {
            this.open(); // Open the chest if it's already unlocked
        } else {
            const equipment = player.getComponent("minecraft:equippable");
            const item = equipment.getEquipment("Mainhand");

            // Extract tier from the chest type ID
            const tier = +(chest_entity.typeId.replace('cosmos:tier', '').replace('_treasure_chest', ''));

            // Validate the item used to unlock the chest
            if (tiers[item?.typeId] !== chest_entity.typeId) {
                hint(player, tier); // Provide feedback to the player
                return;
            }

            // Update the chest state to unlocked
            chest_entity.setPermutation(chest.withState('cosmos:chest_state', this.unlockedState));
            this.open(); // Open the chest after unlocking
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
            const chestState = chest_entity.permutation.getState('custom:open'); // Get current open state
            const nextChestState = chest_entity.permutation.withState('custom:open', Math.max(chestState - 1, 0)); // Decrement state
            chest_entity.setPermutation(nextChestState); // Update the chest's state

            // Clear the interval if the chest is fully closed
            if (chestState <= 0) {
                system.clearRun(this.interval);
            }
        }, this.cooldown);
    }
}