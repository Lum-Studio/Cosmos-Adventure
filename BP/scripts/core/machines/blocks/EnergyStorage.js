import { system, ItemStack } from "@minecraft/server";
import { get_entity, location_of_side, charge_from_machine, charge_from_battery, update_battery, } from "../../matter/electricity.js";
import { get_data, floor_position, compare_position } from "../../../api/utils.js";


function charge_battery(machine, energy, slot) {
	const container = machine.getComponent('minecraft:inventory').container
	const battery = container.getItem(slot)
	if (battery && energy > 0 && (battery.getDynamicProperty('energy') ?? 0) < 15000 ) {
		let charge = battery.getDynamicProperty('energy') ?? 0
		const space = 15000 - charge
		charge += Math.min(200, energy, space)
		energy -= Math.min(200, energy, space)
		container.setItem(slot, update_battery(battery, charge))
	} return energy
}

export default class {
    constructor(entity, block) {
		this.entity = entity;
		this.block = block;
        if (entity.isValid()) this.processEnergy()
    }

	onPlace(){
		const container = this.entity.getComponent('minecraft:inventory').container
		const store_data = get_data(this.entity);
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§. ${0} gJ\nof ${store_data.capacity} gJ`
		container.setItem(2, counter)
		counter.nameTag = `cosmos:f${Math.ceil((0/ store_data.capacity) * 75 )}`
		container.setItem(3, counter)
	}
	processEnergy() {
		//retrieve data
		const store = this.entity
		const container = this.entity.getComponent('minecraft:inventory').container;
		const store_data = get_data(store)
		let energy = this.entity.getDynamicProperty("cosmos_energy");
		let should_updates = this.entity.getDynamicProperty("cosmos_should_updates");
		energy = energy ? + energy : 0

		let first_energy = energy;
		
		energy = charge_from_machine(store, this.block, energy)
		
		energy = charge_battery(store, energy, 0)
		
		energy = charge_from_battery(store, energy, 1)
		
		//store and display data

		if(energy !== first_energy || should_updates){
			this.entity.setDynamicProperty("cosmos_energy", energy);
			this.entity.setDynamicProperty("cosmos_power", Math.min(energy, store_data.maxPower));
			this.entity.setDynamicProperty("cosmos_should_updates");
			const counter = new ItemStack('cosmos:ui')
			counter.nameTag = `cosmos:§. ${energy} gJ\nof ${store_data.capacity} gJ`
			container.setItem(2, counter)
			counter.nameTag = `cosmos:f${Math.ceil((energy/ store_data.capacity) * 75 )}`
			container.setItem(3, counter)
			counter.nameTag = ``
			counter.setLore([''+energy, ''+Math.min(energy, store_data.maxPower)])
			container.setItem(4, counter)
		}
		
		//change the block look
		 try { if (this.block?.typeId != "minecraft:air") {
			const fill_level = Math.round((energy/ store_data.capacity) * 16 )
			if (fill_level == 16) {
				this.block.setPermutation(this.block.permutation
					.withState("cosmos:fill_level", 0)
					.withState("cosmos:full", true)
				)
			} else 
			this.block.setPermutation(this.block.permutation
				.withState("cosmos:fill_level", fill_level)
				.withState("cosmos:full", false)
			)
		}} catch(_) {null}
	}
}