import { system, world, ItemStack } from "@minecraft/server";
const fuelTypes = new Set(["minecraft:coal", "minecraft:charcoal", "minecraft:coal_block"]);

export default class {
  constructor(entity, block) {
    this.entity = entity;
    this.block = block;
    if (entity.isValid()) {
      this.onPlace();
      this.generateHeat();
    }
  }
  
  onPlace() {
    const container = this.entity.getComponent('minecraft:inventory').container;
    // Initialize UI elements
    container.updateUI(
      [
        { slot: 1, text: data => data.power === 0 ? 'Not Generating' : 'Generating' },
        { slot: 2, text: data => data.power === 0 ? (' Hull Heat: ' + data.heat + '%%') : ('  §r' + data.power + ' gJ/t') }
      ],
      { heat: 0, power: 0 }
    );
  }
  
  generateHeat() {
    const container = this.entity.getComponent('minecraft:inventory').container;
    const fuelItem = container.getItem(0);
    const isCoalBlock = fuelItem?.typeId === 'minecraft:coal_block';
    let burnTime = this.entity.getDynamicProperty("cosmos_burnTime") ?? 0;
    let heat = this.entity.getDynamicProperty("cosmos_heat") ?? 0;
    let power = this.entity.getDynamicProperty("cosmos_power") ?? 0;

    const first_burnTime = burnTime;
    const first_heat = heat;
    const first_power = power;
    if (fuelTypes.has(fuelItem?.typeId) && burnTime === 0) {
      container.setItem(0, fuelItem.decrementStack());
      burnTime = isCoalBlock ? 3200 : 320;
    }
    if (burnTime > 0) burnTime--;
    
    // Adjust heat and power based on burnTime.
    if (burnTime > 0 && heat < 100) heat++;
    if (burnTime === 0 && heat > 0 && power === 0) heat--;
    if (burnTime > 0 && heat === 100 && burnTime % 3 === 0 && power < 120) power++;
    if (burnTime === 0 && system.currentTick % 3 === 0 && power > 0) power--;
    
    // Update U
    container.updateUI(
      [
        { slot: 1, text: data => data.power === 0 ? 'Not Generating' : 'Generating' },
        { slot: 2, text: data => data.power === 0 ? (' Hull Heat: ' + data.heat + '%%') : ('  §r' + data.power + ' gJ/t') }
      ],
      { heat: heat, power: power }
    );
    
    // Only update dynamic properties if changes occurred.
    if (heat !== first_heat) this.entity.setDynamicProperty("cosmos_heat", heat);
    if (burnTime !== first_burnTime) this.entity.setDynamicProperty("cosmos_burnTime", burnTime);
    if (power !== first_power) this.entity.setDynamicProperty("cosmos_power", power);
  }
}
