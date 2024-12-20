import { system, ItemStack } from "@minecraft/server";
import { MachineBlockEntity } from "../MachineBlockEntity";
import { compare_position, get_entity, location_of_side, charge_from_machine, charge_from_battery, update_baterry, floor_position, } from "../../matter/electricity.js";
import { get_data } from "../../../api/utils.js";

function charge_machine(machine, block, energy) {
	const data = get_data(machine)
	const output_location = location_of_side(block, data.energy_output)
	const output_machine = get_entity(machine.dimension, output_location, "has_power_input")
	if ( output_machine && Math.min(energy, data.maxPower) > 0 ) {
		const output_block = machine.dimension.getBlock(output_location)
		const output_container = output_machine.getComponent('minecraft:inventory').container
		const output_data = get_data(output_machine)
		const power = Math.min(energy, data.maxPower)
		const lore = output_container.getItem(output_data.lore.slot)?.getLore()
		const output_energy = lore ? + lore[output_data.lore.energy] : output_data.capacity
		const space = output_data.capacity - output_energy
		const io = location_of_side(output_block, output_data.energy_input)
		if (compare_position(floor_position(machine.location), io)) {
			if (space == 0 && output_machine.typeId.includes('energy_storage')) energy = charge_machine(output_machine, block, energy)
			else energy -= Math.min(output_data.maxInput, power, space)
		}
	} return energy
}

function charge_battery(machine, energy, slot) {
	const container = machine.getComponent('minecraft:inventory').container
	const battery = container.getItem(slot)
	if (battery && energy > 0 && (battery.getDynamicProperty('energy') ?? 0) < 15000 ) {
		let charge = battery.getDynamicProperty('energy') ?? 0
		const space = 15000 - charge
		charge += Math.min(200, energy, space)
		energy -= Math.min(200, energy, space)
		container.setItem(slot, update_baterry(battery, charge))
	} return energy
}

export default class  extends MachineBlockEntity {
    constructor(block, entity) {
        super(block, entity);
        if (this.entity.isValid()) this.processEnergy()
    }

	processEnergy() {
		//retrieve data
		const store = this.entity
		const container = this.entity.getComponent('minecraft:inventory').container;
		const store_data = get_data(store)
		let energy = container.getItem(4) ? + container.getItem(4).getLore()[0] : 0
		
		energy = charge_machine(store, this.block, energy)
		
		energy = charge_from_machine(store, this.block, energy)
		
		energy = charge_battery(store, energy, 0)
		
		energy = charge_from_battery(store, energy, 1)
		
		//store and display data
		const counter = new ItemStack('cosmos:ui')
		counter.nameTag = `cosmos:§. ${energy} gJ\nof ${store_data.capacity} gJ`
		container.setItem(2, counter)
		counter.nameTag = `cosmos:f${Math.ceil((energy/ store_data.capacity) * 75 )}`
		container.setItem(3, counter)
		counter.nameTag = ``
		counter.setLore([''+energy, ''+Math.min(energy, store_data.maxPower)])
		container.setItem(4, counter)
		
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