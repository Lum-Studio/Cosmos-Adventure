import { Block, ItemStack, World, Player } from "@minecraft/server";

/**
 * Decrements the amount of the ItemStack by 1.
 * @returns {ItemStack | undefined} The modified ItemStack or undefined if amount is 1.
 */
ItemStack.prototype.decrementStack = function(decrementItemAmount=1) {
    if (this.amount > decrementItemAmount) {
        this.amount = this.amount - decrementItemAmount;
        return this;
    } else return undefined;
};

/**
 * Increments the amount of the ItemStack by 1.
 * @returns {ItemStack} The modified ItemStack or same ItemStack if amount is 64.
 */
ItemStack.prototype.incrementStack = function(incrementItemMax=64, incrementItemAmount=1) {
    if (this.amount < incrementItemMax) {
        this.amount = this.amount + incrementItemAmount;
    } return this;
};

//seamlessly giving a player an item or ejecting it infront of the player if inventory is full
Player.prototype.give = function (item, amount=1, data=0) {
    this.runCommand("gamerule sendcommandfeedback false")
    this.runCommand(`give @s ${item} ${amount} ${data}`)
    this.runCommand("stopsound @a random.pop")
    this.runCommand("gamerule sendcommandfeedback true")
};

Block.prototype.getNeighbors = function (maxSearch = 27) {
    const directions = ["above", "north", "east", "west", "south", "below"]
    const connectedBlocks = []
    const visted = new Set();
    const queue = [this.location]
    while (connectedBlocks.length < maxSearch) {
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
    } return connectedBlocks;
}

World.prototype.getDims = function (fn = null) {
    // dimension.getEntities returns a entity array, so flatMap to combine it into one array
    return ['overworld', 'nether', 'the_end'].flatMap(dim => {
        const dimension = this.getDimension(dim);
        return fn ? fn(dimension) : dimension
    })
}