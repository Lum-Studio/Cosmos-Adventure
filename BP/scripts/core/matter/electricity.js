import { world } from "@minecraft/server";
import AllMachineBlocks from "../machines/AllMachineBlocks"
export function get_data(machine) { return AllMachineBlocks[machine.typeId.replace('cosmos:machine:', '')] }
function str(object) { return JSON.stringify(object) }
function say(message = 'yes') { world.sendMessage('' + message) }
export function compare_position(a, b){
	return a.x == b.x && a.y == b.y && a.z == b.z
}

export function get_entity(dimension, location, family) {
	return dimension.getEntities({
		families: [family],
		location: location,
		maxDistance: 0.5,
	})[0]
}

export function charge_from_machine(entity, block, energy) {
	const data = get_data(entity)
	let connectedMachines = (entity.getDynamicProperty("input_connected_machines"))? JSON.parse(entity.getDynamicProperty("input_connected_machines")):
	undefined;
	if (connectedMachines && connectedMachines.length > 0 && energy < data.capacity) {
		for (let input_entity_id of connectedMachines) {
			if (world.getEntity(input_entity_id[0]) && input_entity_id[0] != entity.id && input_entity_id[1] == "output") {
				let input_entity = world.getEntity(input_entity_id[0])
				const input_container = input_entity.getComponent('minecraft:inventory').container
				const input_data = get_data(input_entity)
				const lore = input_container.getItem(input_data.lore.slot)?.getLore()
				const power = lore ? + lore[input_data.lore.power] : 0
				const space = data.capacity - energy
				if(power > 0){
					energy += Math.min(data.maxInput, power, space)
				}
			}
		}
	} else {
		const input_location = location_of_side(block, data.energy_input)
		const input_entity = get_entity(entity.dimension, input_location, "has_power_output")
		if ( input_entity && energy < data.capacity ) {
			const input_block = entity.dimension.getBlock(input_location)
			const input_container = input_entity.getComponent('minecraft:inventory').container
			const input_data = get_data(input_entity)
			const lore = input_container.getItem(input_data.lore.slot)?.getLore()
			const power = lore ? + lore[input_data.lore.power] : 0
			const space = data.capacity - energy
			const io = location_of_side(input_block, input_data.energy_output)
			if(compare_position(entity.location, io) && power > 0){
				energy += Math.min(data.maxInput, power, space)
			}
		}
	} return energy
}

export function charge_from_battery(machine, energy, slot) {
	const data = get_data(machine)
	const container = machine.getComponent('minecraft:inventory').container
	const battery = container.getItem(slot)
	if (battery && energy < data.capacity && (battery.getDynamicProperty('energy') ?? 0) > 0) {
		let charge = battery.getDynamicProperty('energy') ?? 0
		const space = data.capacity - energy
		energy += Math.min(data.maxInput, 200, charge, space)
		charge -= Math.min(data.maxInput, 200, charge, space)
		container.setItem(slot, update_baterry(battery, charge))
	} return energy
}

const TURN_BY = {
	front: 0,
	left: Math.PI / 2,
	back: Math.PI,
	right: -Math.PI / 2,
}
const ROTATE_BY = {
	west: 0,
	north: Math.PI / 2,
	east: Math.PI,
	south: -Math.PI / 2,
}

// this function takes a Block and a Side (left, right, back, or front) and returns a location {x, y, z}
export function location_of_side({location, permutation}, side) {
	if (!side) return
	const facing = permutation.getState("minecraft:cardinal_direction")
	if (!facing) return
	const direction = ROTATE_BY[facing]
	const x = Math.round(Math.cos(direction + TURN_BY[side]))
	const z = Math.round(Math.sin(direction + TURN_BY[side]))
	return {
		x: location.x + x,
		y: location.y,
		z: location.z + z
	}
}

export function update_baterry(battery, charge) {
	battery.setLore([`§r§${
		Math.floor(charge) >= 10000 ? '2' :
		Math.floor(charge) < 5000 ? '4' : '6'
	}${Math.floor(charge)} gJ/15,000 gJ`])
	battery.getComponent('minecraft:durability').damage = 15000 - Math.floor(charge)
	battery.setDynamicProperty('energy', Math.floor(charge))
	return battery
}