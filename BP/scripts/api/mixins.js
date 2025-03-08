import { world, Block, ItemStack, World, Player, Container } from "@minecraft/server";
import { BlockUpdate } from "./libraries/BlockUpdate";
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
    if ((incrementItemMax === 64)? this.amount < incrementItemMax: this.amount <= incrementItemMax) {
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
Block.prototype.four_neighbors = function(sides=["north", "east", "west", "south"]) {
    const blocks = {}
    sides.forEach(side => {
        blocks[side] = this[side]()
    })
    return blocks
}

// returns an object eg: { above: Block, north: Block, east: Block, ...}
Block.prototype.six_neighbors = function() {
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












//SEN PART : ???????? ;P
  world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
    // Save the original registerCustomComponent method.
    const originalRegister = blockComponentRegistry.registerCustomComponent;
  
    // Create an internal array to keep track of all registered custom component IDs.
    blockComponentRegistry.__registeredComponents = [];
  
    // Monkey-patch the registry’s registerCustomComponent method.
    blockComponentRegistry.registerCustomComponent = (componentId, definition) => {
      if (typeof definition.onUpdate !== "function") {
        definition.onUpdate = event => {
          // Default behavior (no-op) for onUpdate.
          // console.log(`Default onUpdate for component ${componentId} on block at ${event.block.location}`);
        };
      }
      // Record this component ID so we know which ones to update later.
      blockComponentRegistry.__registeredComponents.push(componentId)
      // Call the original registration method.
      return originalRegister.call(blockComponentRegistry, componentId, definition);
    };
  });
  
  // Hook BlockUpdate system to automatically call onUpdate for any custom component
  // registered on the updated block. This works for any custom component string.
  BlockUpdate.on(update => {
    const block = update.block;
  
    // Access the global registry 
    const registry = block.dimension.blockComponentRegistry;
    if (!registry || !registry.__registeredComponents) return;
  
    // Iterate over every registered custom component.
    for (const componentId of registry.__registeredComponents) {
      // If this block has the component, call its onUpdate method.
      const component = block.getComponent(componentId);
      if (component && typeof component.onUpdate === "function") {
        component.onUpdate({
          block: block,
          source: update.source,
        });
      }
    }
  });
  
//EXAMPLE
//   world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
//     blockComponentRegistry.registerCustomComponent("custom:component", {
//       onPlace: ({ block }) => {
//         console.log("Block placed at", block.location);
//       },
//       onPlayerDestroy: event => {
//         console.log("Block destroyed at", event.block.location);
//       },
//       // Optionally, you can override onUpdate.
//       onUpdate: event => {
//         console.log("Block updated at", event.block.location);
//         // Example behavior: change the block to air.
//         event.block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.Air));
//       }
//     });
//   });
  