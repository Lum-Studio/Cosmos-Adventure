import { ItemStack } from "@minecraft/server";

/**
 * Decrements the amount of the ItemStack by 1.
 * @returns {ItemStack | undefined} The modified ItemStack or undefined if amount is 1.
 */
ItemStack.prototype.decrementStack = function () {
    if (this.amount > 1) {
        this.amount--;
        return this;
    } else return undefined;
};
/**
 * Increments the amount of the ItemStack by 1.
 * @returns {ItemStack | undefined} The modified ItemStack or ItemStack if amount is 64.
 */
ItemStack.prototype.incrementStack = function () {
    if (this.amount < 64) {
        this.amount++;
    } return this;
};
