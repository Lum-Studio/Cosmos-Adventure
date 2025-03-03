import { Block, ItemStack, World, Player, Container, world, ContainerSlot } from "@minecraft/server";

/**
 * Decrements the amount of the ItemStack by 1.
 * @returns {ItemStack | undefined} The modified ItemStack or undefined if amount is 1.
 */
ItemStack.prototype.decrementStack = function (decrementItemAmount = 1) {
    if (this.amount > decrementItemAmount) {
        this.amount = this.amount - decrementItemAmount;
        return this;
    } else return undefined;
};

/**
 * Increments the amount of the ItemStack by 1.
 * @returns {ItemStack} The modified ItemStack or same ItemStack if amount is 64.
 */
ItemStack.prototype.incrementStack = function (incrementItemMax = 64, incrementItemAmount = 1) {
    if ((incrementItemMax === 64) ? this.amount < incrementItemMax : this.amount <= incrementItemMax) {
        this.amount = this.amount + incrementItemAmount;
    } return this;
};
{
    const amt = Object.getOwnPropertyDescriptors(ContainerSlot.prototype).amount.set;
    const tpd = Object.getOwnPropertyDescriptors(ContainerSlot.prototype).typeId.get;
    Object.defineProperties(ContainerSlot.prototype, {
        amount: {
            set(a) { a <= 0 ? this.setItem() : amt.call(this, a); }
        },
        typeId: {
            get() { return this.hasItem() ? tpd.call(this) : undefined }
        }
    });
};

//seamlessly giving a player an item or ejecting it infront of the player if inventory is full
Player.prototype.give = function (item, amount = 1, data = 0) {
    this.runCommand("gamerule sendcommandfeedback false")
    this.runCommand(`give @s ${item} ${amount} ${data}`)
    this.runCommand("stopsound @a random.pop")
    this.runCommand("gamerule sendcommandfeedback true")
};
{
    const hands = new WeakMap();
    Player.prototype.hand = function (item) {
        const hand = hands.get(this) ?? hands.set(this, this.getComponent("equippable").getEquipmentSlot("Mainhand")).get(this);
        item && hand.setItem(item);
        return hand;
    };
}


//WTF is this?
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
                null//console.error(e, e.stack)
            }
        }
    } return connectedBlocks;
}

// returns an object eg: { north: Block, east: Block, west: Block, ...}
Block.prototype.four_neighbors = function (sides = ["north", "east", "west", "south"]) {
    const blocks = {}
    sides.forEach(side => {
        blocks[side] = this[side]()
    })
    return blocks
}

// returns an object eg: { above: Block, north: Block, east: Block, ...}
Block.prototype.six_neighbors = function () {
    return this.four_neighbors(["above", "north", "east", "west", "south", "below"])
}

World.prototype.getDims = function (fn = null) {
    // dimension.getEntities returns a entity array, so flatMap to combine it into one array
    return ['overworld', 'nether', 'the_end'].flatMap(dim => {
        const dimension = this.getDimension(dim);
        return fn ? fn(dimension) : dimension
    })
};

Container.prototype.add_ui_button = function (slot, text, lore) {
    const button = new ItemStack('cosmos:ui_button')
    button.nameTag = text ?? ''
    if (lore) button.setLore(lore)
    this.setItem(slot, button)
}

Container.prototype.add_ui_display = function (slot, text, damage) {
    const button = new ItemStack('cosmos:ui')
    if (damage) {
        const durability = button.getComponent('durability')
        durability.damage = durability.maxDurability - damage
    }
    button.nameTag = text ?? ''
    this.setItem(slot, button)
}
