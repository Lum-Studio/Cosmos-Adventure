import {world, system} from "@minecraft/server";
import AllMachineBlocks from "../machines/AllMachineBlocks"


function output_block(entity) {
	const location = entity.location
	const direction = entity.getProperty("cosmos:direction")
	const output = AllMachineBlocks[entity.typeId].energy_output
	if (output == "left") {
		const output_location = {
			x: direction == "north" ? location.x + 1 : direction == "south" ? location.x - 1 : location.x,
			y: location.y,
			z: direction == "west" ? location.z - 1 : direction == "east" ? location.z + 1 : location.z,
		}
		const output_entity = dimension.getEntities({
			families: ["cosmos"],
			location: output_location,
			maxDistance: 0.5,
		})[0]
		const output_input = AllMachineBlocks[output_entity.typeId].energy_input
	}
}

function move_energy(block, output = output_block(block), input = input_block(block)) {
	
	const power = block.getProperty("cosmos:power")
	const energy = block.getProperty("cosmos:energy")
	const capacity = block.getProperty("cosmos:capacity")
	
	const input_power = input?.getProperty("cosmos:power")
	const input_energy = input?.getProperty("cosmos:energy") ?? 1000000
	const output_energy = output?.getProperty("cosmos:energy")
	const output_capacity = output?.getProperty("cosmos:capacity")
	
	const is_output = (output && output_energy != output_capacity && energy != 0)
	const is_input = (input && input_energy != 0 && energy != capacity)
	
	const updated_energy = Math.min(Math.max(0, energy + (is_input ? Math.min(input_energy, input_power) : 0) - (is_output ? Math.min(energy, power) : 0)), capacity)
	
	block.setProperty("cosmos:energy", updated_energy)
	
	const batteries = block.getComponent('minecraft:inventory').container
	const output_slot = batteries.getItem(0)
	const input_slot = batteries.getItem(1)
	
	if ((!input || input_energy == 0) && (!output || output_energy == output_capacity)) {
		if (output_slot?.typeId == "cosmos:battery" && (input_slot?.typeId != "cosmos:battery" || input_slot?.getDynamicProperty('energy') == 0)) {
			let charge = output_slot.getDynamicProperty('energy') ?? 0
			if (charge < 15000 && energy > 0) {
				charge = Math.min(15000, charge + 200)
				output_slot.setLore([`§r§${
					charge >= 10000 ? '2' :
					charge < 5000 ? '4' : '6'
				}${charge} gJ/15,000 gJ`])
				output_slot.getComponent('minecraft:durability').damage = 15000 - charge
				output_slot.setDynamicProperty('energy', charge)
				batteries.setItem(0, output_slot)
				block.setProperty("cosmos:energy", Math.max(0, energy - 200))
			}
		}
		if (input_slot?.typeId == "cosmos:battery" && (output_slot?.typeId != "cosmos:battery" || output_slot?.getDynamicProperty('energy') == 15000)) {
			let charge = input_slot.getDynamicProperty('energy') ?? 0
			if (charge > 0 && energy < capacity) {
				charge = Math.max(0, charge - 200)
				input_slot.setLore([`§r§${
					charge >= 10000 ? '2' :
					charge < 5000? '4' : '6'
				}${charge} gJ/15,000 gJ`])
				input_slot.getComponent('minecraft:durability').damage = 15000 - charge - 1
				input_slot.setDynamicProperty('energy', charge)
				batteries.setItem(1, input_slot)
				block.setProperty("cosmos:energy", Math.min(capacity, energy + 200))
			}
		}
		if (output_slot?.typeId == "cosmos:battery" && input_slot?.typeId == "cosmos:battery") {
			let output_charge = output_slot.getDynamicProperty('energy') ?? 0
			let input_charge = input_slot.getDynamicProperty('energy') ?? 0
			if (output_charge < 15000 && input_charge > 0) {
				output_charge = Math.min(15000, output_charge + 200)
				output_slot.setLore([`§r§${
					output_charge >= 10000 ? '2' :
					output_charge < 5000 ? '4' : '6'
				}${output_charge} gJ/15,000 gJ`])
				output_slot.getComponent('minecraft:durability').damage = 15000 - output_charge
				output_slot.setDynamicProperty('energy', output_charge)
				input_charge = Math.max(0, input_charge - 200)
				input_slot.setLore([`§r§${
					input_charge >= 10000 ? '2' :
					input_charge < 5000? '4' : '6'
				}${input_charge} gJ/15,000 gJ`])
				input_slot.getComponent('minecraft:durability').damage = 15000 - input_charge - 1
				input_slot.setDynamicProperty('energy', input_charge)
				batteries.setItem(1, input_slot)
				batteries.setItem(0, output_slot)
			}
		}
	}
	block.nameTag = `en ${block.getProperty("cosmos:energy")}gJ`
}

/* // will fix it later
system.runInterval (()=> {
	const dimensions = ['overworld', 'nether', 'the_end'].map(dim => (world.getDimension(dim)))
	const energy_stores = []
	const consumers = []
	dimensions.forEach(dim => dim.getEntities({families: ['energy_storage']}).forEach(i => energy_stores.push(i)))
	dimensions.forEach(dim => dim.getEntities({families: ['consumer']}).forEach(i => consumers.push(i)))
	
	energy_stores.forEach(block => {
		move_energy(block)
	})
	//consumers.forEach(block => {
	//	take_energy(block)
	//})
})
*/