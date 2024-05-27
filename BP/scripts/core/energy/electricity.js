import {world, system, ItemStack} from "@minecraft/server";
import AllMachineBlocks from "../machines/AllMachineBlocks"
function get_data(machine) {return AllMachineBlocks[machine.typeId.replace('cosmos:machine:', '')]}
function str(object) { return JSON.stringify(object) }
function say(message='yes') {world.sendMessage(''+message)}

const sides = new Map([
  ["cosmos:up", "above"],
  ["cosmos:down", "below"],
  ["cosmos:north", "north"],
  ["cosmos:east", "east"],
  ["cosmos:south", "south"],
  ["cosmos:west", "west"],
])


const dimensions = ['overworld', 'nether', 'the_end'].map(dim => (world.getDimension(dim)))

const TURN_BY = {
	front: 0,
	left: Math.PI/2,
	back: Math.PI,
	right: -Math.PI/2,
}
const ROTATE_BY = {
	west: 0,
	north: Math.PI/2,
	east: Math.PI,
	south: -Math.PI/2,
}

export function get_machine_connections(machine, direction=null) {
	const machine_data = get_data(machine)
	const output = direction ? location_of(machine, machine_data.energy_output, direction) : location_of(machine, machine_data.energy_output)
	output.x -= 0.5; output.z -= 0.5
	const input = direction ? location_of(machine, machine_data.energy_input, direction) : location_of(machine, machine_data.energy_input)
	input.x -= 0.5; input.z -= 0.5
	return [input, output]
}

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

function update_baterry(battery, charge) {
	battery.setLore([`§r§${
		charge >= 10000 ? '2' :
		charge < 5000 ? '4' : '6'
	}${charge} gJ/15,000 gJ`])
	battery.getComponent('minecraft:durability').damage = 15000 - charge
	battery.setDynamicProperty('energy', charge)
	return battery
}

function process_energy(store) {
	//retrieve data
    const container = store.getComponent('minecraft:inventory').container;
	const store_data = get_data(store)
	let energy = container.getItem(4) ? + container.getItem(4).getLore()[0] : 0
	
	//give energy to the output
	const output_location = location_of(store, store_data.energy_output)
	const output_entity = store.dimension.getEntities({
		families: ["has_power_input"],
		location: output_location,
		maxDistance: 0.5,
	})[0]
	const output_wire = store.dimension.getBlock(output_location)
	if ( output_entity && Math.min(energy, store_data.maxPower) > 0 ) {
		const output_container = output_entity.getComponent('minecraft:inventory').container
		const output_data = get_data(output_entity)
		const power = Math.min(energy, store_data.maxPower)
		const data = output_container.getItem(output_data.lore.slot)?.getLore()
		const output_energy = data ? + data[output_data.lore.energy] : output_data.capacity
		const space = output_data.capacity - output_energy
		const {sx, sy, sz} = store.location
		const {iox, ioy, ioz} = location_of(output_entity, output_data.energy_input)
		if ( sx == iox && sy == ioy && sz == ioz ) {
			energy -= Math.min(power, space)
		}
	} //this part deals with wires
	else if (output_wire.typeId == "cosmos:aluminum_wire") {
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
	}
	
	//take power from the input energy input
	const input_entity = store.dimension.getEntities({
		families: ["has_power_output"],
		location: location_of(store, store_data.energy_input),
		maxDistance: 0.5,
	})[0]
	if ( input_entity && energy < store_data.capacity ) {
		const input_container = input_entity.getComponent('minecraft:inventory').container
		const input_data = get_data(input_entity)
		const data = input_container.getItem(input_data.lore.slot)?.getLore()
		const power = data ? + data[input_data.lore.power] : 0
		const space = store_data.capacity - energy
		const {sx, sy, sz} = store.location
		const {iox, ioy, ioz} = location_of(input_entity, input_data.energy_output)
		if ( sx == iox && sy == ioy && sz == ioz && power > 0) {
			energy += Math.min(power, space)
		}
	}
	
	//charge output battery
	const output_battery = container.getItem(0)
	if (output_battery && energy > 0 && (output_battery.getDynamicProperty('energy') ?? 0) < 15000 ) {
		let charge = output_battery.getDynamicProperty('energy') ?? 0
		const battery_space = 15000 - charge
		charge += Math.min(200, energy, battery_space)
		energy -= Math.min(200, energy, battery_space)
		container.setItem(0, update_baterry(output_battery, charge))
	}
	
	//take energy from input battery
	const input_battery = container.getItem(1)
	if (input_battery && energy < store_data.capacity && (input_battery.getDynamicProperty('energy') ?? 0) > 0) {
		let charge = input_battery.getDynamicProperty('energy') ?? 0
		const space = store_data.capacity - energy
		energy += Math.min(200, charge, space)
		charge -= Math.min(200, charge, space)
		container.setItem(1, update_baterry(input_battery, charge))
	}
	
	//store and display data
	const counter = new ItemStack('clock')
	counter.nameTag = `cosmos:§. ${energy} gJ\nof ${store_data.capacity} gJ`
	container.setItem(2, counter)
	counter.nameTag = `cosmos:f${Math.floor(energy * 75 / store_data.capacity)}`
	container.setItem(3, counter)
	counter.nameTag = ``
	counter.setLore([''+energy, ''+Math.min(energy, store_data.maxPower)])
	container.setItem(4, counter)
}

system.runInterval (()=> {
	dimensions.forEach(dim => 
		dim.getEntities({families: ['energy_storage']}).forEach(store =>
			process_energy(store)
		)
	)
})