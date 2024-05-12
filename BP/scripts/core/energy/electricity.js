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

function get_input(entity, location) {
	const direction = entity.getRotation().y + (entity.typeId == "cosmos:oxygen_collector" ? 180 : 0)
	const dimension = entity.dimension
	return dimension.getEntities({
		families: ["energy_storage", "generator"],
		location: location,
		maxDistance: 0.5,
		maxHorizontalRotation: direction,
		minHorizontalRotation: direction
	})[0]
}
function get_output(entity, location) {
	const direction = entity.getRotation().y
	const dimension = entity.dimension
	return dimension.getEntities({
		families: ["energy_storage", "consumer"],
		location: location,
		maxDistance: 0.5,
	}).filter(e => ((
		e.getRotation().y == direction &&
		['cosmos:energy_storage_module', 'cosmos:energy_storage_module'].includes(e.typeId)
	) || (
		e.getRotation().y == direction + 180 &&
		['cosmos:oxygen_collector'].includes(e.typeId)
	)))[0]
}

function move_energy(block, output = get_output(block, rightLocation(block)), input = get_input(block, leftLocation(block))) {
	
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
function take_energy(block, input = get_input(block, leftLocation(block))) {
	
	const power = block.getProperty("cosmos:power")
	const energy = block.getProperty("cosmos:energy")
	const capacity = block.getProperty("cosmos:capacity")
	
	const input_power = input?.getProperty("cosmos:power")
	const input_energy = input?.getProperty("cosmos:energy") ?? 1000000
	
	const is_input = (input && input_energy != 0 && energy != capacity)
	
	const updated_energy = Math.min(energy + (is_input ? Math.min(input_energy, input_power) : 0), capacity)
	
	block.setProperty("cosmos:energy", updated_energy)
	
	const battery = block.getComponent('minecraft:inventory').container.getItem(0)
	
	if (!input || input_energy == 0) {
		if (battery?.typeId == "cosmos:battery") {
			let charge = battery.getDynamicProperty('energy') ?? 0
			if (charge > 0 && energy < capacity) {
				charge = Math.max(0, charge - 50)
				battery.setLore([`§r§${
					charge >= 10000 ? '2' :
					charge < 5000? '4' : '6'
				}${charge} gJ/15,000 gJ`])
				battery.getComponent('minecraft:durability').damage = 15000 - charge - 1
				battery.setDynamicProperty('energy', charge)
				block.getComponent('minecraft:inventory').container.setItem(0, battery)
				block.setProperty("cosmos:energy", Math.min(capacity, energy + 50))
			}
		}
	}
	block.nameTag = `en ${block.getProperty("cosmos:energy")}gJ`
}


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