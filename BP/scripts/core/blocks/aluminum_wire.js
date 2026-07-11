import { world, system, BlockPermutation } from "@minecraft/server"
import machines from "../machines/AllMachineBlocks.js"
import { get_entity, location_of_side, compare_position, six_neighbors, save_dynamic_object } from "../../api/utils.js"
import { get_data } from "../machines/Machine.js"

export function str_pos(location) {
	if (!location) return
	const {x, y, z} = location
	return `${x} ${y} ${z}`
}

export const same_side = {
	above: "cosmos:up",
	below: "cosmos:down",
	north: "cosmos:north",
	south: "cosmos:south",
	east: "cosmos:east",
	west: "cosmos:west", 
}
export const opposite_side = {
	above: "cosmos:down",
	below: "cosmos:up",
	north: "cosmos:south",
	south: "cosmos:north",
	east: "cosmos:west", 
	west: "cosmos:east",
}

export function detach_wires(wire) {
	const neighbors = six_neighbors(wire)
	for (const side in neighbors) {
		const neighbor = neighbors[side]
		if (!neighbor.hasTag("wire")) continue
		const found_machines = wiresDFS(neighbor)
		neighbor.setPermutation(neighbor.permutation.withState(opposite_side[side], false))
		machinesSearch(found_machines)
	}
}

function getSides(wireOs, permutation, wires, counter){
	let sides = permutation.getAllStates();
	let loc = wireOs.location;
	const blocks = {
		"cosmos:up": {x: loc.x, y: loc.y + 1, z: loc.z},
		"cosmos:down": {x: loc.x, y: loc.y - 1, z: loc.z},
		"cosmos:north": {x: loc.x, y: loc.y, z: loc.z - 1},
		"cosmos:south": {x: loc.x, y: loc.y, z: loc.z + 1},
		"cosmos:east": {x: loc.x + 1, y: loc.y, z: loc.z},
		"cosmos:west": {x: loc.x - 1, y: loc.y, z: loc.z}
	}
	for(let block in sides){
		if(!sides[block] || !blocks[block]) continue;
		let loc_as_string = JSON.stringify(blocks[block]);
		let wire_in_map = wires.get(loc_as_string);
		if(!wire_in_map){
			let wire_block = wireOs.dimension.getBlock(blocks[block]);
			let type = (wire_block?.hasTag("wire"))? "wire": undefined;

			if(type && wire_block?.hasTag("heavy_wire")) counter.heavy_wires++;
			else if(type) counter.wires++;

			wires.set(loc_as_string, {type: type, connected: type ? undefined: loc});
		}else if(wire_in_map.connected && !compare_position(loc, wire_in_map.connected)){
			wire_in_map.slot = "both";
			wires.set(loc_as_string, wire_in_map);
		}
	}
}
function wiresDFS(firstWire, perm = firstWire.permutation){
	let wiresWillDone = new Map();
	let foundMachines = [];
	let wiresIterator = wiresWillDone[Symbol.iterator]();

	let counter = {heavy_wires: firstWire.hasTag("heavy_wire") ? 1: 0, wires: 0};
	getSides(firstWire, perm, wiresWillDone, counter);
	
	for(let wire of wiresIterator){
		let block = firstWire.dimension.getBlock(JSON.parse(wire[0]));
		if(wire[1].type == "wire" && !block.isAir){
			getSides(block, block.permutation, wiresWillDone, counter)
		}
	}
	wiresWillDone.forEach((value, key) => {
		if(value.type == "wire") return;
		let block = firstWire.dimension.getBlock(JSON.parse(key));
		if(block.isAir) return;
		let machineEntity = get_entity(block.dimension, block.center(), "cosmos");
		if(!machineEntity) return;
		
		let machineData = get_data(machineEntity);
		let input = location_of_side(block, machineData.energy.input);
		let output = location_of_side(block, machineData.energy.output);
		let final_slot = (value.slot == "both")? "both":
		(input && compare_position(input, value.connected))? "input":
		(output && compare_position(output, value.connected))? "output":
		undefined;

		//so it's sets tier to 2 if all wires connected to input slot are heavy
		let energy_tier = {level: 1};
		if(final_slot && final_slot != "output" && counter.heavy_wires > 0 && counter.wires === 0 && machineEntity.dimension.getBlock(value.connected)?.hasTag("heavy_wire")){
			energy_tier = {level: 2};
		}
		
		foundMachines.push([machineEntity.id, final_slot, energy_tier])
	});
	return foundMachines;
}
export function machinesSearch(foundMachines){
	foundMachines.forEach((element) => {
		let final = world.getEntity(element[0])
		let finalData = get_data(final)
		let inputSide = (finalData.energy.input)? final.dimension.getBlock(location_of_side(final.dimension.getBlock(final.location), finalData.energy.input)):
		undefined;
		let outputSide = (finalData.energy.output)? final.dimension.getBlock(location_of_side(final.dimension.getBlock(final.location), finalData.energy.output)):
		undefined;
		
		let connectedInputSide = (inputSide && !inputSide.isAir && inputSide.hasTag("wire"))? wiresDFS(inputSide): undefined;
		let connectedOutputSide = (outputSide && !outputSide.isAir && outputSide.hasTag("wire"))? wiresDFS(outputSide): undefined;
		let finalConnectedInputSide = (connectedInputSide)? connectedInputSide.filter((element) => element[0] != final.id): undefined;
		let finalConnectedOutputSide = (connectedOutputSide)? connectedOutputSide.filter((element) => element[0] != final.id): undefined;

		save_dynamic_object(final, element[2], "machine_data", "energy_tier")

		final.setDynamicProperty("input_connected_machines", JSON.stringify(finalConnectedInputSide))
		final.setDynamicProperty("output_connected_machines", JSON.stringify(finalConnectedOutputSide))
	});
}

// this function takes a Block (A Machine Block)
export function attach_to_wires(block) {
	const machine_type = block.typeId.split(':').pop()
	if (!Object.keys(machines).includes(machine_type) || !machines[machine_type].energy) return
	const machine = machines[machine_type]
	const connections = [
		location_of_side(block, machine.energy.input),
		location_of_side(block, machine.energy.output)
	]
	for (const connection of connections) {
		if (!connection) continue
		const wire = block.dimension.getBlock(connection)
		if (wire.hasTag("wire")) connect_wires(wire)
	}
	system.run(() => {
	let machineOutputWire = (machine.energy.output)? block.dimension.getBlock(connections[1]):
	undefined;
	let machineInputWire = (machine.energy.input)? block.dimension.getBlock(connections[0]):
	undefined;
	if(machineOutputWire && !machineOutputWire.isAir && machineOutputWire.hasTag("wire")) machinesSearch(wiresDFS(machineOutputWire))
	if(machineInputWire && !machineInputWire.isAir && machineInputWire.hasTag("wire")) machinesSearch(wiresDFS(machineInputWire))
	});
}
// this function takes a Block (A Wire)
function connect_wires(wire) {
	const neighbors = six_neighbors(wire)
	const states = {}
	for (const [side, block] of Object.entries(neighbors)) {
		if (block.hasTag("wire") && (!block.hasTag("switchable") || block.permutation.getState("cosmos:switch"))) {
			block.setPermutation(block.permutation.withState(opposite_side[side], true))
			states[same_side[side]] = true
		}
		const machine_type = block.typeId.split(':').pop()
		if (Object.keys(machines).includes(machine_type)) {
			const machine = machines[machine_type]
			const connections = [
				str_pos(location_of_side(block, machine.energy.input)),
				str_pos(location_of_side(block, machine.energy.output))
			]
			if (connections.includes(str_pos(wire.location))) states[same_side[side]] = true
		}
	}
	wire.setPermutation(BlockPermutation.resolve(wire.typeId, states))
	system.run(() => {machinesSearch(wiresDFS(wire))});
}

export const aluminum_wire_component = {
	onPlace({block}) {
		connect_wires(block)
	},
	onPlayerBreak(event){
		detach_wires(event.block)
		machinesSearch(wiresDFS(event.block, event.brokenBlockPermutation))
	}
}

export const switchable_wire_component = {
	onRedstoneUpdate({block, powerLevel}) {
        if (powerLevel){
			 block.setPermutation(BlockPermutation.resolve(block.typeId, { "cosmos:up": false, "cosmos:down": false,
			"cosmos:north": false, "cosmos:east": false, "cosmos:south": false, "cosmos:west": false,  "cosmos:switch": false}));
			detach_wires(block)
		}
        else{
			connect_wires(block)
			block.setPermutation(block.permutation.withState("cosmos:switch", true));
		}
    }
}