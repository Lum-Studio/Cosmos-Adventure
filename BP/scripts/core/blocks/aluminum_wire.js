import { world, system, BlockPermutation } from "@minecraft/server"
import { get_machine_connections, compare_position, get_entity, get_data, location_of, location_of_side} from "../matter/electricity.js"
import machines from "../machines/AllMachineBlocks.js"

function str_pos(location) {
	if (!location) return
	const {x, y, z} = location
	return`${x} ${y} ${z}`
}

const faces = ["cosmos:up", "cosmos:north", "cosmos:east", "cosmos:west", "cosmos:south", "cosmos:down"]

export function detach_wires(wire) {
    let machines = wiresDFS(wire)
	const neighbors = wire.getNeighbors(6);
	for (const [i, wireNeighbor] of neighbors.entries()) {
		if (wireNeighbor.typeId == 'cosmos:aluminum_wire') {
			const side_connections = wireNeighbor.permutation.getAllStates()
			side_connections[faces[5 - i]] = false
			wireNeighbor.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
		}
	}
	machinesSearch(machines)
}

function getSides(wireOs, wireOsDone, permutation){
	let sides = []
	if(permutation.getState("cosmos:north") && !wireOsDone.includes(JSON.stringify(wireOs.north().location))) sides.push(wireOs.north().location)
	if(permutation.getState("cosmos:south") && !wireOsDone.includes(JSON.stringify(wireOs.south().location))) sides.push(wireOs.south().location)
	if(permutation.getState("cosmos:west") && !wireOsDone.includes(JSON.stringify(wireOs.west().location))) sides.push(wireOs.west().location)
	if(permutation.getState("cosmos:east") && !wireOsDone.includes(JSON.stringify(wireOs.east().location))) sides.push(wireOs.east().location)
	if(permutation.getState("cosmos:up") && !wireOsDone.includes(JSON.stringify(wireOs.above().location))) sides.push(wireOs.above().location)
	if(permutation.getState("cosmos:down") && !wireOsDone.includes(JSON.stringify(wireOs.below().location))) sides.push(wireOs.below().location)
	sides.push(JSON.stringify(wireOs))
	return sides;
}
function wiresDFS(wire, perm = wire.permutation){
	let wiresDone = [];
	let wiresWillDone = [];
	let machines = [];
	wiresWillDone.push(getSides(wire, wiresDone, perm));
	while(wiresWillDone.length !== 0){
		let wireOb = wiresWillDone.shift();
		let cleaned = wireOb.filter((element) => typeof element != "string")
		let slot = wireOb.filter((element) => typeof element === "string")[0]
		cleaned.forEach((blockGeneral) =>{
			let block = wire.dimension.getBlock(blockGeneral)
			if(block.typeId != "cosmos:aluminum_wire" && get_entity(block.dimension, block.center(), "cosmos")){
				let machineEntity = get_entity(block.dimension, block.center(), "cosmos");
				let machineData = get_data(machineEntity)
				let input = (machineData.energy_input)? machineEntity.dimension.getBlock(location_of(machineEntity, machineData.energy_input)).location:
				undefined;
				let output = (machineData.energy_output)? machineEntity.dimension.getBlock(location_of(machineEntity, machineData.energy_output)).location:
				undefined;
				let checking = (element) => {return compare_position(machineEntity.dimension.getBlock(element).location, machineEntity.dimension.getBlock(JSON.parse(slot)).location)}
				let final_slot = (input && machineEntity.dimension.getBlock(input) && checking(input))? "input":
				(output && machineEntity.dimension.getBlock(output) && checking(output))? "output":
				undefined;
				machines.push([machineEntity.id, final_slot])
				wiresDone.push(blockGeneral)
			}
			else{
				wiresDone.push(blockGeneral)
				wiresWillDone = [getSides(block, wiresDone, block.permutation), ...wiresWillDone]
			}
			wiresDone.push(JSON.stringify(blockGeneral))
		})
	}
	return machines
}
export function machinesSearch(machines){
	machines.forEach((element) => {
		let final = world.getEntity(element[0])
		let finalData = get_data(final)
		let inputSide = (finalData.energy_input)? final.dimension.getBlock(location_of(final, finalData.energy_input)):
		undefined;
		let outputSide = (finalData.energy_output)? final.dimension.getBlock(location_of(final, finalData.energy_output)):
		undefined;
		
		let connectedInputSide = (inputSide && !inputSide.isAir && inputSide.typeId == 'cosmos:aluminum_wire')? wiresDFS(inputSide): undefined;
		let connectedOutputSide = (outputSide && !outputSide.isAir && outputSide.typeId == 'cosmos:aluminum_wire')? wiresDFS(outputSide): undefined;
		let finalConnectedInputSide = (connectedInputSide)? connectedInputSide.filter((element) => element[0] != final.id): undefined;
		let finalConnectedOutputSide = (connectedOutputSide)? connectedOutputSide.filter((element) => element[0] != final.id): undefined;
		final.setDynamicProperty("input_connected_machines", JSON.stringify(finalConnectedInputSide))
		final.setDynamicProperty("output_connected_machines", JSON.stringify(finalConnectedOutputSide))
	});
}

const same_side = {
	above: "cosmos:up",
	below: "cosmos:down",
	north: "cosmos:north",
	south: "cosmos:south",
	east: "cosmos:east",
	west: "cosmos:west", 
}
const opposite_side = {
	above: "cosmos:down",
	below: "cosmos:up",
	north: "cosmos:south",
	south: "cosmos:north",
	east: "cosmos:west", 
	west: "cosmos:east",
}

// get_machine_connections takes an entity not a block.
export function attach_to_wires(block) {
	const machine_type = block.typeId.split(':').pop()
	if (!Object.keys(machines).includes(machine_type)) return
	const machine = machines[machine_type]
	const connections = [
		location_of_side(block, machine.energy_input),
		location_of_side(block, machine.energy_output)
	]
	for (const connection of connections) {
		if (!connection) continue
		const wire = block.dimension.getBlock(connection)
		if (wire.typeId == "cosmos:aluminum_wire") connect_wires(wire)
	}
}

export function attachWires(machine) {
	let dataOfMachine = get_data(machine)
	let machineOutputWire = (dataOfMachine.energy_output)? machine.dimension.getBlock(location_of(machine, dataOfMachine.energy_output)):
	undefined;
	let machineInputWire = (dataOfMachine.energy_input)? machine.dimension.getBlock(location_of(machine, dataOfMachine.energy_input)):
	undefined;
	if(machineOutputWire && !machineOutputWire.isAir && machineOutputWire.typeId == 'cosmos:aluminum_wire') machinesSearch(wiresDFS(machineOutputWire))
	if(machineInputWire && !machineInputWire.isAir && machineInputWire.typeId == 'cosmos:aluminum_wire') machinesSearch(wiresDFS(machineInputWire))
}

// takes a Block
function connect_wires(wire) {
	const neighbors = wire.six_neighbors()
	const states = {}
	for (const [side, block] of Object.entries(neighbors)) {
		if (block.typeId == 'cosmos:aluminum_wire') {
			block.setPermutation(block.permutation.withState(opposite_side[side], true))
			states[same_side[side]] = true
		}
		const machine_type = block.typeId.split(':').pop()
		if (Object.keys(machines).includes(machine_type)) {
			const machine = machines[machine_type]
			const connections = [
				str_pos(location_of_side(block, machine.energy_input)),
				str_pos(location_of_side(block, machine.energy_output))
			]
			if (connections.includes(str_pos(wire.location))) states[same_side[side]] = true
		}
	}
	wire.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", states))
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('cosmos:aluminum_wire', {
		onPlace({block}) {
			connect_wires(block)
		},
		onPlayerDestroy(event){
			detach_wires(event.block)
			machinesSearch(wiresDFS(event.block, event.destroyedBlockPermutation))
		}
	})
})

world.afterEvents.playerPlaceBlock.subscribe((event) => {
	if(event.block.typeId != "cosmos:aluminum_wire") return;
	machinesSearch(wiresDFS(event.block))
})