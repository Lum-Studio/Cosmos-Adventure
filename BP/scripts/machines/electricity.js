import {world, system} from "@minecraft/server";

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