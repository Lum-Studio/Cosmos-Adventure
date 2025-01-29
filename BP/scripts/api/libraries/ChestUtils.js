import { system } from "@minecraft/server";

export class ChestUtils {
    constructor(chest_entity) {
        // Initialize the chest entity and set up parameters for opening/closing
        this.chest_entity = chest_entity; // The chest entity being managed
        this.maxOpen = 5; // Maximum times the chest can be opened
        this.maxClose = -1; // Minimum times the chest can be closed (default -1 means no limit)
        this.interval = 0; // Interval for the opening animation
        this.cooldown = 1; // Cooldown time between opening actions
    }

    /**
     * Opens the chest and plays the opening sound.
     * @returns {void}
     */
    open() {
        const { chest_entity, maxOpen, cooldown } = this;
        const { dimension, location } = chest_entity; // Extract the dimension and location of the chest
        
        // Check if the chest has the 'custom_open' tag
        if (chest_entity.hasTag('custom_open')) {
            const chest = this.getChest(chest_entity); // Get the chest block
            
            // Confirm it has the 'custom_chest' tag
            if (chest.hasTag('custom_chest')) {
                // Play the chest opening sound
                dimension.playSound('random.chestopen', location);
                // Set the chest's dynamic property to indicate it is open
                chest_entity.setDynamicProperty('isOpen', true);
                
                // Start an interval to animate the chest opening
                this.interval = system.runInterval(() => {
                    const chestState = chest.permutation.getState('custom:open'); // Get current open state
                    const nextChestState = chest.permutation.withState('custom:open', chestState + 1); // Increment state
                    chest.setPermutation(nextChestState); // Update the chest's state
                    
                    // Clear the interval if the max open state is reached
                    if ((chestState + 1) >= maxOpen)
                        system.clearRun(this.interval);
                }, cooldown);
            }
        }
    }

    /**
     * Closes the chest if it is currently open.
     * @returns {void}
     */
    close() {
        const { chest_entity, maxClose } = this;
        const { dimension, location } = chest_entity; // Extract the dimension and location
        
        // Check if the chest is already marked as open
        if (chest_entity.hasTag('custom_open'))
            return; // Exit if it is currently open
        
        const chest = this.getChest(chest_entity); // Get the chest block
        const chestState = chest?.permutation.getState('custom:open'); // Get the current open state
        const nextChestState = chest?.permutation.withState('custom:open', chestState - 1); // Decrement state
        
        // Confirm it has the 'custom_chest' tag
        if (chest?.hasTag('custom_chest')) {
            // Check if the new state would be below the allowed close limit
            if ((chestState - 1) <= maxClose)
                return; // Exit if it cannot close further
            
            // Update the chest's state
            chest?.setPermutation(nextChestState);
            
            // If the chest was previously open, close it and play the closing sound
            if (chest_entity.getDynamicProperty('isOpen')) {
                chest_entity.setDynamicProperty('isOpen', false);
                dimension.playSound('random.chestclosed', location);
            }
        }
    }

    /**
     * Drops all items in the chest's inventory at its location and removes the chest entity.
     * @returns {void}
     */
    drop() {
        const { chest_entity } = this;
        const { dimension, location } = chest_entity; // Extract the dimension and location
        const chest = this.getChest(chest_entity); // Get the chest block
        
        // If the chest is not found, exit the method
        if (chest)
            return;

        const inv = chest_entity.getComponent('inventory').container; // Get the chest's inventory
        // Iterate through the inventory to drop items
        for (let i = 0; i < inv?.size; i++) {
            const item = inv?.getItem(i); // Get each item in the inventory
            if (item) {
                dimension.spawnItem(item, location); // Spawn the item at the chest's location
                inv?.setItem(i, undefined); // Remove the item from the inventory
            }
        }
        chest_entity.remove(); // Finally, remove the chest entity
    }

    /**
     * Retrieves the chest block associated with the given entity.
     * @param {Object} entity - The chest entity.
     * @returns {Object|null} - The chest block if found, otherwise null.
     */
    getChest(entity) {
        const { location, dimension } = entity; // Extract location and dimension
        const chest = dimension.getBlock(location); // Get the block at the chest's location
        
        // Return the chest if it has the 'custom_chest' tag
        if (chest?.hasTag('custom_chest'))
            return chest;
    }
}