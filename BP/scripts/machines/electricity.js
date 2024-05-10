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
	let total_energy = block.getProperty("cosmos:energy")
	if (input) {
		const capacity = block.getProperty("cosmos:capacity")
		const power = input.getProperty("cosmos:power")
		const stored_energy = total_energy
		const available_energy = input.getProperty("cosmos:energy") ?? 1000000; //world.sendMessage(`${capacity} ${power} ${stored_energy} ${available_energy} `)
		if (stored_energy != capacity && power != 0) {
			const moved_energy = Math.min(available_energy, power)
			if (stored_energy + moved_energy <= capacity) {  //if there is enough capacity
				total_energy += moved_energy
			} else {  //not enough capacity
				total_energy = capacity
			}
		}
	}
	world.sendMessage(''+total_energy)
	if (output) {
		const capacity = output.getProperty("cosmos:capacity")
		const power = block.getProperty("cosmos:power")
		const available_energy = total_energy
		const stored_energy = output.getProperty("cosmos:energy")
		if (stored_energy != capacity) {
			const moved_energy = Math.min(available_energy, power)
			if (stored_energy + moved_energy <= capacity) {  //if there is enough capacity
				total_energy -= moved_energy
			} else {  //not enough capacity
				total_energy -= (capacity - stored_energy)
			}
		}
	}
	block.setProperty("cosmos:energy", total_energy)
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