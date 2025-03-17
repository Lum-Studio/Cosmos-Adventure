import { world, Block, ItemStack, World, Player, Container } from "@minecraft/server";

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

// {
//     const Dimension = world.getDimension("overworld");
//     const dimensionProto = Object.getPrototypeOf(Dimension);
//     if (!dimensionProto.stopSound) {
//       /**
//        * Stops a sound at a specified location.
//        *
//        * @param {string} soundName - The name of the sound to stop.
//        * @param {{ x: number, y: number, z: number }} location - The location at which to stop the sound.
//        * @returns {} callback
//        */
//       dimensionProto.stopSound = function (soundName, location) {
//         return this.runCommand(
//           `execute positioned ${location.x} ${location.y} ${location.z} run stopsound @a ${soundName}`
//         );
//       };
//     }
// };




// /**
//    * Adds a progress bar to the specified slot.
//    * If the slot is empty, it assigns a barrier ItemStack with nameTag "0".
//    * If an item already exists, its value is set to "0".
//    * @param {number} slotIndex - The index of the slot.
//    * @returns {object} The progress bar object.
//    */
// Container.prototype.addProgressBar = function(slotIndex) {
//  // Create a progress bar with an initial value of 0.
//  const progressBar = { slotIndex: slotIndex, value: 0 };
//  this._progressBars[slotIndex] = progressBar;
 
//  // Get the container slot.
//  const slot = this.getSlot(slotIndex);
//  if (slot.hasItem()) {
//    slot.nameTag = "0";
//  } else {
//    const item = new ItemStack("minecraft:barrier", 1);
//    item.nameTag = "0";
//    this.setItem(slotIndex, item);
//  }
//  return progressBar;
// };

// /**
// * Retrieves an existing progress bar for the given slot index,
// * or creates one if it does not exist.
// * @param {number} slotIndex - The index of the slot.
// * @returns {object} The progress bar object.
// */
// Container.prototype.getOrCreateProgressBar = function(slotIndex) {
//  return this._progressBars[slotIndex] || this.addProgressBar(slotIndex);
// };

// Container.prototype.getProgressBar = function(slotIndex) {
//     // Return the stored progress bar if it exists.
//     if (this._progressBars && this._progressBars[slotIndex]) {
//       return this._progressBars[slotIndex];
//     }
    
//     // Attempt to derive a progress bar from the slot's item.
//     const slot = this.getSlot(slotIndex);
//     if (slot && slot.hasItem() && typeof slot.nameTag === 'string') {
//       // Try to parse the nameTag as an integer.
//       const value = parseInt(slot.nameTag, 10);
//       if (!isNaN(value)) {
//         // Clamp the progress value between 0 and 9.
//         const progressValue = Math.max(0, Math.min(9, value));
//         const progressBar = { slotIndex: slotIndex, value: progressValue };
//         // Ensure our progressBars store exists.
//         if (!this._progressBars) {
//           this._progressBars = {};
//         }
//         // Save and return the derived progress bar.
//         this._progressBars[slotIndex] = progressBar;
//         return progressBar;
//       }
//     }
    
//     // If nothing found, return null.
//     return null;
//   };

// /**
// * Sets the progress value (clamped between 0 and 9) for the progress bar
// * at the given slot, and updates the slot's value.
// * @param {number} slotIndex - The index of the slot.
// * @param {number} value - New progress value (0-9).
// */
// Container.prototype.setProgressBar = function(slotIndex, value) {
//  const progressBar = this.getProgressBar(slotIndex);
//  if (!progressBar) {
//    console.warn(`Progress bar at slot ${slotIndex} not found.`);
//    return;
//  }
 
//  // Clamp value between 0 and 9.
//  progressBar.value = Math.max(0, Math.min(9, value));
 
//  // Update the slot's visual indicator.
//  const slot = this.getSlot(slotIndex);
//  if (slot.hasItem()) {
//    slot.nameTag = String(progressBar.value);
//  } else {
//    console.warn(`Slot ${slotIndex} is empty.`);
//  }
// };

// Container.prototype.updateUI = function(uiConfigs, machineData) {
//   uiConfigs.forEach(config => {
//     const uiItem = new ItemStack('cosmos:ui');
//     // Determine the text: if a function, call it with machineData, otherwise use the string.
//     const text = (typeof config.text === 'function') ? config.text(machineData) : (config.text || "");
//     uiItem.nameTag = `cosmos:${text}`;
//     // If lore is provided, do the same.
//     if (config.lore) {
//       const lore = (typeof config.lore === 'function') ? config.lore(machineData) : config.lore;
//       uiItem.setLore(lore);
//     }
//     this.setItem(config.slot, uiItem);
//   });
// };

// /**
//  * Updates the UI for an energy storage machine.
//  * @param {number} energy - The current energy level.
//  * @param {object} storeData - An object with energy storage parameters (capacity, maxPower, etc.).
//  */
// Container.prototype.updateEnergyUI = function(energy, storeData) {
//   const power = Math.min(energy, storeData.maxPower);
//   // Update dynamic properties on the entity.
//   this.entity.setDynamicProperty("cosmos_energy", energy);
//   this.entity.setDynamicProperty("cosmos_power", power);

//   const uiConfigs = [
//     {
//       slot: 2,
//       text: data => `§. ${data.energy} gJ\nof ${data.capacity} gJ`
//     },
//     {
//       slot: 3,
//       text: data => `f${Math.ceil((data.energy / data.capacity) * 75)}`
//     },
//     {
//       slot: 4,
//       text: "",
//       lore: data => ["" + data.energy, "" + data.power]
//     }
//   ];

//   // Update the UI elements using the machine data.
//   this.updateUI(uiConfigs, {
//     energy: energy,
//     capacity: storeData.capacity,
//     maxPower: storeData.maxPower,
//     power: power
//   });
// };

// /**
//  * Sets the energy value on the entity.
//  * @param {number} energy - The new energy value.
//  */
// Container.prototype.setEnergy = function(energy) {
//   this.entity.setDynamicProperty("cosmos_energy", energy);
// };

// /**
//  * Retrieves the current energy value from the entity.
//  * @returns {number} The current energy value.
//  */
// Container.prototype.getEnergy = function() {
//   return this.entity.getDynamicProperty("cosmos_energy") || 0;
// };

// /**
//  * Adds an amount of energy.
//  * @param {number} amount - The amount to add.
//  * @returns {number} The updated energy value.
//  */
// Container.prototype.addEnergy = function(amount) {
//   let energy = this.getEnergy();
//   energy += amount;
//   this.setEnergy(energy);
//   return energy;
// };

// /**
//  * Subtracts an amount of energy (without going below zero).
//  * @param {number} amount - The amount to subtract.
//  * @returns {number} The updated energy value.
//  */
// Container.prototype.subtractEnergy = function(amount) {
//   let energy = this.getEnergy();
//   energy = Math.max(0, energy - amount);
//   this.setEnergy(energy);
//   return energy;
// };

