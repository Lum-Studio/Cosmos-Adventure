import { world, system, ItemStack, BlockPermutation, Block } from "@minecraft/server"
import { get_machine_connections, compare_position, get_entity, get_data, location_of} from "../matter/electricity.js"
function str(object) { return JSON.stringify(object) }

const faces = ["cosmos:up", "cosmos:north", "cosmos:east", "cosmos:west", "cosmos:south", "cosmos:down"]


export function attach_wires(block, machine, direction = null) { // get_machine_connections takes an entity not a block.
	
	const [input, output] = direction ? get_machine_connections(machine, direction) : get_machine_connections(machine)
	const neighbors = block.getNeighbors(6);
	for (const [i, wire] of neighbors.entries()) {
		if (wire.typeId != 'cosmos:aluminum_wire') continue
		const attach = compare_position(wire.location, output) || compare_position(wire.location, input)
		const side_connections = wire.permutation.getAllStates()
		side_connections[faces[5 - i]] = attach
		wire.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
		let machines = wiresDFS(wire)
		machines.forEach((element) => {
			let final = world.getEntity(element[0])
			let finalData = get_data(final)
			let finalConnected = wiresDFS(final.dimension.getBlock(location_of(final, (element[1] == "output")? finalData.energy_output: finalData.energy_input)))
			final.setDynamicProperty("connected_machines", JSON.stringify(finalConnected))
		})
	}
}

export function detach_wires(wire) {
	const neighbors = wire.getNeighbors(6);
	for (const [i, wireNeighbor] of neighbors.entries()) {
		if (wireNeighbor.typeId == 'cosmos:aluminum_wire') {
			const side_connections = wireNeighbor.permutation.getAllStates()
			side_connections[faces[5 - i]] = false
			wireNeighbor.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
			let machines = wiresDFS(wireNeighbor)
			machines.forEach((element) => {
				let final = world.getEntity(element[0])
				let finalData = get_data(final)
				let finalConnected = wiresDFS(final.dimension.getBlock(location_of(final, (element[1] == "output")? finalData.energy_output: finalData.energy_input)))
				final.setDynamicProperty("connected_machines", JSON.stringify(finalConnected))
			})

		}
	}
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

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('cosmos:wire_placement', {
		beforeOnPlayerPlace(event) {
			const { block } = event;
			const { location, dimension } = block;
			const neighbors = block.getNeighbors(6);
			const connections = {}
			for (const [i, wire] of neighbors.entries()) {
				if (wire.typeId == 'cosmos:aluminum_wire') {
					const side_connections = wire.permutation.getAllStates()
					side_connections[faces[5 - i]] = true
					wire.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
					connections[faces[i]] = true
				}
				const machine = dimension.getEntities({
					families: ["power"],
					location: wire.center(),
					maxDistance: 0.5
				})[0]
				if (machine) {
					const [input, output] = get_machine_connections(machine)
					if (compare_position(location, input) || compare_position(location, output)) connections[faces[i]] = true
				}
			} event.permutationToPlace = BlockPermutation.resolve("cosmos:aluminum_wire", connections)
		},
		onPlayerDestroy(event){
			let machines = wiresDFS(event.block, event.destroyedBlockPermutation)
			machines.forEach((element) => {
				let final = world.getEntity(element[0])
				let finalData = get_data(final)
				let finalConnected = wiresDFS(final.dimension.getBlock(location_of(final, (element[1] == "output")? finalData.energy_output: finalData.energy_input)))
				final.setDynamicProperty("connected_machines", JSON.stringify(finalConnected))
			})
		}
	})
})

world.beforeEvents.playerBreakBlock.subscribe((event) => {
	const {block, dimension, player} = event
	system.run(()=>{detach_wires(block)})
	if (block.typeId == "cosmos:aluminum_wire") {
		if ((player.getGameMode() == "creative")) return
		event.cancel = true
		system.run(()=>{
			dimension.spawnItem(new ItemStack("cosmos:aluminum_wire_item"), block.center()),
			dimension.playSound("dig.cloth", block.location)
			block.setPermutation(BlockPermutation.resolve("air"))
		})
	}
})
world.afterEvents.playerPlaceBlock.subscribe((event) => {
	if(event.block.typeId != "cosmos:aluminum_wire") return;
	let machines = wiresDFS(event.block)
	machines.forEach((element) => {
		let final = world.getEntity(element[0])
		let finalData = get_data(final)
		let finalConnected = wiresDFS(final.dimension.getBlock(location_of(final, (element[1] == "output")? finalData.energy_output: finalData.energy_input)))
		final.setDynamicProperty("connected_machines", JSON.stringify(finalConnected))
	})
}) 