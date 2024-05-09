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
function rightEntity(entity, location) {
	const dimension = entity.dimension
	const direction = entity.getRotation().y
	return dimension.getEntities({
		families: ["cosmos"],
		location: location,
		maxDistance: 0.5,
		maxHorizontalRotation: direction,
		minHorizontalRotation: direction
	})[0]
}

export function charge(block) {
	const power = block.getProperty("cosmos:power")
	const source_energy = block.getDynamicProperty("energy")
	const output = rightEntity(block, rightLocation(block))
	if (output) {
		const target_energy = output.getDynamicProperty("energy") ?? 0
		const capacity = output.getProperty("cosmos:capacity")
		if (target_energy != capacity) {
			if (source_energy) {
				const transfer = source_energy > power ? power : source_energy
				if (target_energy + transfer > capacity) {
					block.setDynamicProperty("energy", source_energy - (capacity - target_energy))
					output.setDynamicProperty("energy", capacity)
				} else {
					block.setDynamicProperty("energy", source_energy - transfer)
					output.setDynamicProperty("energy", target_energy + transfer)
				}
			} else {
				if (target_energy + power > capacity) {
					output.setDynamicProperty("energy", capacity)
				} else output.setDynamicProperty("energy", target_energy + power)
			}
		}
		
		const en = output.getDynamicProperty("energy") ?? 0
		output.nameTag = `en ${en}gJ`
	}
}