import { Block, ItemStack, World } from "@minecraft/server";

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

Block.prototype.getNeighbors = function (maxSearch = 27) {
    const directions = ["above", "north", "east", "west", "south", "below"]
    const connectedBlocks = []
    const visted = new Set();
    const queue = [this.location]
    while (connectedBlocks.length <= maxSearch) {
        const loc = queue.pop();
        const hash = `${loc.x},${loc.y},${loc.z}`
        if (!visted.has(hash)) {
            visted.add(hash);
            try {
                for (const dir of directions) {
                    const offsetBlock = this[dir]();
                    const newHash = `${offsetBlock.x},${offsetBlock.y},${offsetBlock.z}`
                    if (!visted.has(newHash)) {
                        visted.add(hash);
                        queue.push(offsetBlock.location);
                        connectedBlocks.push(offsetBlock)
                    }
                }
            } catch (e) {
                console.error(e, e.stack)
            }
        }
    }
    return connectedBlocks;
}

World.prototype.getDims = function (fn = null) {
    // dimension.getEntities returns a entity array, so flatMap to combine it into one array
    return ['overworld', 'nether', 'the_end'].flatMap(dim => {
        const dimension = this.getDimension(dim);
        return fn ? fn(dimension) : dimension
    })
}