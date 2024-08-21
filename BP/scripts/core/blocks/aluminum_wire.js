import { world, system, ItemStack, BlockPermutation, Block } from "@minecraft/server"
import { get_machine_connections, compare_position } from "../matter/electricity.js"
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
	}
}

export function detach_wires(wire) {
	const neighbors = wire.getNeighbors(6);
	for (const [i, wireNeighbor] of neighbors.entries()) {
		if (wireNeighbor.typeId == 'cosmos:aluminum_wire') {
			const side_connections = wireNeighbor.permutation.getAllStates()
			side_connections[faces[5 - i]] = false
			wireNeighbor.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
		}
	}
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