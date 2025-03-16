/**
   * "MachineLib" Mixin injector by Refracted
   *
   *
   * UI elements are updated by passing an array of config objects. Each config object should have:
   *   - slot: (number) the container slot to update
   *   - text: (string or function) the text to display; if a function, it receives a machineData object
   *   - lore: (optional, array or function) additional text lines; if a function, it receives machineData
   *
   * In addition, the library provides energy management methods so you can get, set, add, or subtract energy.
   */

  // Generic method to update a set of UI elements from a config array.
  Container.prototype.updateUI = function(uiConfigs, machineData) {
    uiConfigs.forEach(config => {
      const uiItem = new ItemStack('cosmos:ui');
      // Determine the text: if a function, call it with machineData, otherwise use the string.
      const text = (typeof config.text === 'function') ? config.text(machineData) : (config.text || "");
      uiItem.nameTag = `cosmos:${text}`;
      // If lore is provided, do the same.
      if (config.lore) {
        const lore = (typeof config.lore === 'function') ? config.lore(machineData) : config.lore;
        uiItem.setLore(lore);
      }
      this.setItem(config.slot, uiItem);
    });
  };

  /**
   * Updates the UI for an energy storage machine.
   * @param {number} energy - The current energy level.
   * @param {object} storeData - An object with energy storage parameters (capacity, maxPower, etc.).
   */
  Container.prototype.updateEnergyUI = function(energy, storeData) {
    const power = Math.min(energy, storeData.maxPower);
    // Update dynamic properties on the entity.
    this.entity.setDynamicProperty("cosmos_energy", energy);
    this.entity.setDynamicProperty("cosmos_power", power);

    const uiConfigs = [
      {
        slot: 2,
        text: data => `§. ${data.energy} gJ\nof ${data.capacity} gJ`
      },
      {
        slot: 3,
        text: data => `f${Math.ceil((data.energy / data.capacity) * 75)}`
      },
      {
        slot: 4,
        text: "",
        lore: data => ["" + data.energy, "" + data.power]
      }
    ];

    // Update the UI elements using the machine data.
    this.updateUI(uiConfigs, {
      energy: energy,
      capacity: storeData.capacity,
      maxPower: storeData.maxPower,
      power: power
    });
  };

  /**
   * Sets the energy value on the entity.
   * @param {number} energy - The new energy value.
   */
  Container.prototype.setEnergy = function(energy) {
    this.entity.setDynamicProperty("cosmos_energy", energy);
  };

  /**
   * Retrieves the current energy value from the entity.
   * @returns {number} The current energy value.
   */
  Container.prototype.getEnergy = function() {
    return this.entity.getDynamicProperty("cosmos_energy") || 0;
  };

  /**
   * Adds an amount of energy.
   * @param {number} amount - The amount to add.
   * @returns {number} The updated energy value.
   */
  Container.prototype.addEnergy = function(amount) {
    let energy = this.getEnergy();
    energy += amount;
    this.setEnergy(energy);
    return energy;
  };

  /**
   * Subtracts an amount of energy (without going below zero).
   * @param {number} amount - The amount to subtract.
   * @returns {number} The updated energy value.
   */
  Container.prototype.subtractEnergy = function(amount) {
    let energy = this.getEnergy();
    energy = Math.max(0, energy - amount);
    this.setEnergy(energy);
    return energy;
  };
