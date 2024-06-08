import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";
import AllMachineBlocks from "../machines/AllMachineBlocks"
import { MachineInstances } from "../machines/MachineInstances";
function get_data(machine) { return AllMachineBlocks[machine.typeId.replace('cosmos:machine:', '')] }
function str(object) { return JSON.stringify(object) }
function say(message = 'yes') { world.sendMessage('' + message) }

const sides = new Map([
	["cosmos:up", "above"],
	["cosmos:down", "below"],
	["cosmos:north", "north"],
	["cosmos:east", "east"],
	["cosmos:south", "south"],
	["cosmos:west", "west"],
])


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

export function get_machine_connections(machine, direction = null) {
	const machine_data = get_data(machine)
	const output = direction ? location_of(machine, machine_data.energy_output, direction) : location_of(machine, machine_data.energy_output)
	output.x -= 0.5; output.z -= 0.5
	const input = direction ? location_of(machine, machine_data.energy_input, direction) : location_of(machine, machine_data.energy_input)
	input.x -= 0.5; input.z -= 0.5
	return [input, output]
}

export function charge_from_machine(machine, energy) {
	const data = get_data(machine)
	const input_entity = MachineInstances.get(machine.dimension, location_of(machine, data.energy_input), "has_power_output").entity
	if ( input_entity && energy < data.capacity ) {
		const input_container = input_entity.getComponent('minecraft:inventory').container
		const input_data = get_data(input_entity)
		const lore = input_container.getItem(input_data.lore.slot)?.getLore()
		const power = lore ? + lore[input_data.lore.power] : 0
		const space = data.capacity - energy
		const {sx, sy, sz} = machine.location
		const io = str(location_of(input_entity, input_data.energy_output))
		if ( str(machine.location) == io && power > 0) {
			energy += Math.min(data.maxInput, power, space)
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
export function location_of(machine, side, d=null) {
	const location = machine.location
	const direction = d ? ROTATE_BY[d] : ROTATE_BY[machine.getProperty('cosmos:direction')]
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
		charge >= 10000 ? '2' :
		charge < 5000 ? '4' : '6'
	}${charge} gJ/15,000 gJ`])
	battery.getComponent('minecraft:durability').damage = 15000 - charge
	battery.setDynamicProperty('energy', charge)
	return battery
}
/*
function get_connected_wires(wire) {
	const wires = []; const inputs = []; const outputs = []
	const states = wire.permutation.getAllStates()
	sides.forEach((value, key) => {
		if (states[key]) {
			const block = wire[value]()
			if (block.typeId == "cosmos:aluminum_wire") {
				wires.push(block)
			} else {
				const machine = wire.dimension.getEntities({
					families: ["power"],
					location: wire[value]().center(),
					maxDistance: 0.5,
				})[0]
				if (machine) {
					const [input_location, output_location] = get_machine_connections(machine)
					if (str(output_location) == str(wire.location)) inputs.push(machine)
					if (str(input_location) == str(wire.location)) outputs.push(machine)
				}
			}
		}
	})
	return [wires, inputs, outputs]
}*/


/*preserved for wires
	const output_wire = store.dimension.getBlock(output_location)
	if (output_wire.typeId == "cosmos:aluminum_wire") {
		const network = new Set()
		const inputs = new Set()
		const outputs = new Set()
		function buildNetwork(wire) {
			const {x, y, z} = wire.location
			network.add(`${x} ${y} ${z}`)
			const [wires, ins, outs] = get_connected_wires(wire)
			ins.forEach(i => {
				if (!inputs.has(i)) inputs.add(i)
			})
			outs.forEach(o => {
				if (!outputs.has(o)) outputs.add(o)
			})
			wires.forEach(w => {
				if (!network.has(`${w.x} ${w.y} ${w.z}`) && network.size < 32) buildNetwork(w)
			})
		}
		buildNetwork(output_wire)
		//say(`i have ${inputs.size} inputs and ${outputs.size} outputs`))
	}*/