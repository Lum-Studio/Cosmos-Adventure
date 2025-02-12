import * as mc from "@minecraft/server";

type BlockDirection = "north" | "south" | "east" | "west" | "above" | "below";

declare module "@minecraft/server" {
    interface ItemStack {
        /**
         * @param amount The amount to decrement the stack by
         * @returns A new ItemStack with the decremented amount, or undefined if the amount is greater than the stack size
         */
        decrementStack(amount?: number): ItemStack | undefined;

        /**
         * @param maxStackSize The maximum stack size for the item
         * @param amount The amount to increment the stack by
         * @returns A new ItemStack with the incremented amount
         */
        incrementStack(maxStackSize?: number, amount?: number): ItemStack
    }

    interface Player {
        /**
         * Gives the player an item or drops it on the ground if the player's inventory is full
         * @param itemTypeId The item type id to give
         * @param amount The amount of the item to give
         * @param data The data value of the item to give
         */
        give(itemTypeId: string, amount?: number, data?: number): void;
    }

    interface Block {
        /**
         * @param maxSearch The maximum number of blocks to search for neighbors
         * @returns An array of neighboring blocks
         */
        getNeighbors(maxSearch: number): Block[];

        /**
         * @param directions The directions to search for neighbors in
         * @returns A dictionary of some neighboring blocks and their directions
         */
        four_neighbors<T extends BlockDirection[] = ["north", "east", "west", "south"]>(directions?: T): { [K in T[number]]: Block }; // You guys gotta work on conventions...

        /**
         * @returns A dictionary of ALL neighboring blocks and their directions
         */
        six_neighbors(): { [K in BlockDirection]: Block };

    }

    interface World {
        /**
         * Executes a function for each dimension and returns an array of the results
         * @param callback The function to execute for each dimension
         * @returns An array of the results of the callback
         */
        getDims<T>(callback: (dimenion: Dimension) => T): T[];
    }

    interface Container {
        /**
         * Adds a visual button to a container
         * @param slot The slot to add the button to
         * @param uiText The text to display on the button
         * @param lore The lore to display on the button
         */
        add_ui_button(slot: number, uiText?: string, lore?: string[]): void;

        /**
         * Adds a visual display to a container. Used to display bars and other information using the damage on the item
         * @param slot The slot to add the display to
         * @param uiText The text to display on the display
         * @param damage The damage value to display on the display
         */
        add_ui_display(slot: number, uiText?: string, damage?: number): void;
    }
}