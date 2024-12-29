import { system, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity.js";
import { charge_from_battery, charge_from_machine } from "../../matter/electricity.js";
import { get_data, get_lore } from "../../../api/utils.js";

export default class extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity);
        if (this.entity.isValid()) this.load_fuel()
    }

    load_fuel(){
        const stopped = this.entity.getDynamicProperty('stopped')
        const container = this.entity.getComponent('minecraft:inventory').container
	const input = container.getItem(0)
	const data = get_data(this.entity)
	const dimension = this.entity.dimension
		
	let energy = get_lore(container, data, "energy")
	let fuel = get_lore(container, data, "fuel")
		
	energy = charge_from_machine(this.entity, this.block, energy)
		
	energy = charge_from_battery(this.entity, energy, 1)
			
	const status =
	energy == 0 ? "§4No Power" : 
	fuel == 0 ? "§cNo Fuel" :
	energy < 120 ? "§6Not Enough Power":
	stopped ? "§6Ready" :
	"§2Loading"

	const counter = new ItemStack('cosmos:ui')
	counter.nameTag = `cosmos:§energy${Math.round((energy / data.capacity) * 55)}`
	container.setItem(2, counter)
	counter.nameTag = `Energy Storage\n§aEnergy: ${energy} gJ\n§cMax Energy: ${data.capacity} gJ`
	container.setItem(3, counter)
	counter.nameTag = `cosmos:§fill_level${Math.ceil((Math.ceil(fuel / 1000) / (data.fuel_capacity / 1000)) * 38)}§liquid:fuel`
	container.setItem(4, counter)
	counter.nameTag = `Fuel Storage\n§eFuel: ${fuel} / ${data.fuel_capacity} mB`
	container.setItem(5, counter)
	counter.nameTag = `Status:\n${status}`
	container.setItem(6, counter)
	const ui_button = new ItemStack('cosmos:ui_button')
	ui_button.nameTag = `§button${stopped ? 'Stop Loading' : 'Loading'}`
	if (!container.getItem(7)) {
		this.entity.runCommand('clear @a cosmos:ui_button')
		container.setItem(7, ui_button);
		this.entity.setDynamicProperty('stopped', !stopped)
	}
	counter.nameTag = ``
	counter.setLore([''+energy, ''+fuel])
	container.setItem(data.lore.slot, counter)
    }
}

