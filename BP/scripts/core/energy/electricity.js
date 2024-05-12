import {world, system} from "@minecraft/server";
// Node- Rewrite later

function rightLocation(entity) {
	const direction = entity.getRotation().y
	const location = entity.location
	return {
		x: direction == 0 ? location.x - 1 : direction == -180 ? location.x + 1 : location.x,
		y: location.y,
		z: direction == -90 ? location.z + 1 : direction == 90 ? location.z - 1 : location.z,
	}
}
function leftLocation(entity) {
	const direction = entity.getRotation().y
	const location = entity.location
	return {
		x: direction == 0 ? location.x + 1 : direction == -180 ? location.x - 1 : location.x,
		y: location.y,
		z: direction == -90 ? location.z - 1 : direction == 90 ? location.z + 1 : location.z,
	}
}
function get_machine(entity, location) {
	const direction = entity.getRotation().y
	const dimension = entity.dimension
	return dimension.getEntities({
		families: ["cosmos"],
		location: location,
		maxDistance: 0.5,
		maxHorizontalRotation: direction,
		minHorizontalRotation: direction
	})[0]
}
function get_storage(entity, location) {
	const direction = entity.getRotation().y
	const dimension = entity.dimension
	return dimension.getEntities({
		families: ["energy_storage"],
		location: location,
		maxDistance: 0.5,
		maxHorizontalRotation: direction,
		minHorizontalRotation: direction
	})[0]
}

function give_energy(input, output = get_storage(input, rightLocation(input))) {
	const power = input.getProperty("cosmos:power")
	if (output) {
		const capacity = output.getProperty("cosmos:capacity")
		let target_energy = output.getProperty("cosmos:energy")
		if (target_energy != capacity && power != 0) {
			if (target_energy + power <= capacity) {  //if there is enough capacity
				output.setProperty("cosmos:energy", target_energy + power)
			} else {  //not enough capacity
				output.setProperty("cosmos:energy", capacity)
			}
		}
		output.nameTag = `en ${output.getProperty("cosmos:energy")}gJ`
	}
}

function move_energy(block, output = get_storage(block, rightLocation(block)), input = get_machine(block, leftLocation(block))) {
	const power = block.getProperty("cosmos:power")
	const energy = block.getProperty("cosmos:energy")
	const capacity = block.getProperty("cosmos:capacity")
	if (input && !output) {
		const input_power = input.getProperty("cosmos:power")
		const input_energy = input.getProperty("cosmos:energy") ?? 1000000; 
		if (energy != capacity && input_power != 0) {
			const updated_energy = Math.min(energy + Math.min(input_energy, input_power), capacity)
			block.setProperty("cosmos:energy", updated_energy)
		}
	}
	if (output && !input) {
		const output_energy = output.getProperty("cosmos:energy")
		const output_capacity = output.getProperty("cosmos:capacity")
		if (output_energy != output_capacity && energy != 0) {
			const updated_energy = Math.max(0, energy - Math.min(energy, power))
			block.setProperty("cosmos:energy", updated_energy)
		}
	}
	if (input && output) {
		const input_power = input.getProperty("cosmos:power")
		const input_energy = input.getProperty("cosmos:energy") ?? 1000000;
		const output_energy = block.getProperty("cosmos:energy")
		const output_capacity = output.getProperty("cosmos:capacity")
		const updated_energy = Math.min(Math.max(0, energy + Math.min(input_energy, input_power) - Math.min(energy, power)), capacity)
		block.setProperty("cosmos:energy", updated_energy)
	}
	block.nameTag = `en ${block.getProperty("cosmos:energy")}gJ`
	const batteries = block.getComponent('minecraft:inventory').container
	let output_slot = batteries.getItem(0)
	let input_slot = batteries.getItem(1)
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

system.runInterval (()=> {
	const dimensions = ['overworld', 'nether', 'the_end'].map(dim => (world.getDimension(dim)))
	const generators = []
	const energy_stores = []
	dimensions.forEach(dim => dim.getEntities({families: ['generator']}).forEach(i => generators.push(i)))
	dimensions.forEach(dim => dim.getEntities({families: ['energy_storage']}).forEach(i => energy_stores.push(i)))
	
	generators.forEach(block => {
		null
	})
	energy_stores.forEach(block => {
		move_energy(block)
	})
})