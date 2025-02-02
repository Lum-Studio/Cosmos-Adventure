import { system, world, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity";
import { get_vars } from "../../../api/utils.js"

const fuelTypes = new Set(["minecraft:coal", "minecraft:charcoal", "minecraft:coal_block"])

export default class extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity)
        if (this.entity.isValid()) this.generateHeat()
    }
    onPlace(){
		const container = this.entity.getComponent('minecraft:inventory').container
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:${0 == 0 ? 'Not Generating' : 'Generating'}`
		container.setItem(1, counter)
		counter.nameTag = `cosmos:${0 == 0 ? ' Hull Heat: ' + 0 + '%%' : '  §r' + 0 + ' gJ/t'}`
		container.setItem(2, counter)
	}
    generateHeat() {
        const container = this.entity.getComponent('minecraft:inventory').container;
        const fuelItem = container.getItem(0);
		const isCoalBlock = fuelItem?.typeId === 'minecraft:coal_block';
        let burnTime = this.entity.getDynamicProperty("cosmos_burnTime");
		burnTime = (!burnTime)? 0:
		burnTime;
		let heat = this.entity.getDynamicProperty("cosmos_heat");
		heat = (!heat)? 0:
		heat;
		let power = this.entity.getDynamicProperty("cosmos_power");
		power = (!power)? 0:
		power;

		let first_burnTime = burnTime;
		let first_heat = heat;
		let first_power = power;
		
        if ( fuelTypes.has(fuelItem?.typeId) && burnTime == 0) {
			container.setItem(0, fuelItem.decrementStack())
			burnTime = isCoalBlock ? 3200 : 320
		}
		if (burnTime > 0) burnTime--
		
		if (burnTime > 0 && heat < 100) heat++
		
		if (burnTime == 0 && heat > 0 && power == 0) heat--
        
        if (burnTime > 0 && heat == 100 && burnTime % 3 == 0 && power < 120) power++
        
		if (burnTime == 0 && system.currentTick % 3 == 0 && power > 0) power--
		
		const counter = new ItemStack('cosmos:ui')
		if(power !== first_power || heat !== first_heat){
			counter.nameTag = `cosmos:${power == 0 ? ' Hull Heat: ' + heat + '%%' : '  §r' + power + ' gJ/t'}`
			container.setItem(2, counter)
		}
		if(heat !== first_heat) this.entity.setDynamicProperty("cosmos_heat", heat);
		if(burnTime != first_burnTime) this.entity.setDynamicProperty("cosmos_burnTime", burnTime);
		if(power !== first_power){
			this.entity.setDynamicProperty("cosmos_power", power);
			counter.nameTag = `cosmos:${power == 0 ? 'Not Generating' : 'Generating'}`
			container.setItem(1, counter)
		}
    }
}

