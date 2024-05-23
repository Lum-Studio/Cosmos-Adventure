import {world, system, ItemStack} from "@minecraft/server";
import AllMachineBlocks from "../machines/AllMachineBlocks"

//function say(message='yes') {world.sendMessage(''+message)}

const dimensions = ['overworld', 'nether', 'the_end'].map(dim => (world.getDimension(dim)))

const TURN_BY = {
	front: 0,
	right: -Math.PI/2,
	back: Math.PI,
	left: Math.PI/2,
}
const ROTATE_BY = {
	north: Math.PI/2,
	east: Math.PI,
	south: -Math.PI/2,
	west: 0,
}

function location_of(store, side) {
	const location = store.location
	const direction = ROTATE_BY[store.getProperty('cosmos:direction')]
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
	const store_data = AllMachineBlocks[store.typeId]
	let energy = container.getItem(2) ? + container.getItem(2).nameTag?.replace("gJ", "") : 0
	
	//give energy to the output
	const output_entity = store.dimension.getEntities({
		families: ["has_power_input"],
		location: location_of(store, store_data.energy_output),
		maxDistance: 0.5,
	})[0]
	if ( output_entity && Math.min(energy, store_data.maxPower) > 0 ) {
		const output_container = output_entity.getComponent('minecraft:inventory').container
		const output_data = AllMachineBlocks[output_entity.typeId]
		const power = Math.min(energy, store_data.maxPower)
		const energy_slot = output_container.getItem(output_data.slots.energy)
		const output_energy = energy_slot ? + energy_slot.nameTag?.replace("gJ", "") : output_data.capacity
		const space = output_data.capacity - output_energy
		const {sx, sy, sz} = store.location
		const {iox, ioy, ioz} = location_of(output_entity, output_data.energy_input)
		if ( sx == iox && sy == ioy && sz == ioz ) {
			energy -= Math.min(power, space)
		}
	}
	
	//take power from the input energy input
	const input_entity = store.dimension.getEntities({
		families: ["has_power_output"],
		location: location_of(store, store_data.energy_input),
		maxDistance: 0.5,
	})[0]
	if ( input_entity && energy < store_data.capacity ) {
		const input_container = input_entity.getComponent('minecraft:inventory').container
		const input_data = AllMachineBlocks[input_entity.typeId]
		const power_slot = input_container.getItem(input_data.slots.power)
		const power = power_slot ? + power_slot.nameTag?.replace("gJ/t", "") : 0
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
	counter.nameTag = `${energy}gJ`
	container.setItem(2, counter)
	counter.nameTag = `${Math.min(energy, store_data.maxPower)}gJ/t`
	container.setItem(3, counter)
}

system.runInterval (()=> {
	dimensions.forEach(dim => 
		dim.getEntities({families: ['energy_storage']}).forEach(store =>
			process_energy(store)
		)
	)
})