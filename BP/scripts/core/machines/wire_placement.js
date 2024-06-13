import { world, system, BlockPermutation, Block } from "@minecraft/server"
import { get_machine_connections } from "../energy/electricity.js"
import AllMachineBlocks from "./AllMachineBlocks"
import { MachineInstances } from "./MachineInstances.js"
function str(object) { return JSON.stringify(object) }

const sides = ["above", "north", "east", "west", "south", "below"]
const faces = ["cosmos:up", "cosmos:north", "cosmos:east", "cosmos:west", "cosmos:south", "cosmos:down"]


export function attach_wires(block, machine, direction = null) { // get_machine_connections takes and entity not a block.
	const [input, output] = direction ? get_machine_connections(machine, direction) : get_machine_connections(machine)
	/**@type {Block[]} */
	const neighbors = block.getNeighbors(6);
	for (const [i, wire] of neighbors.entries()) {
		if (wire.typeId == 'cosmos:aluminum_wire' && ([str(output), str(input)].includes(str(wire.location)))) {
			const side_connections = wire.permutation.getAllStates()
			side_connections[faces[5 - i]] = true
			wire.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
		}
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

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:wire_placement', {
		beforeOnPlayerPlace(event) {
			const { block } = event;
			const { location, dimension } = block;
			const neighbors = block.getNeighbors(6);
			const connections = {}
			for (const [i, wire] of neighbors.entries()) {
				if (wire.typeId == 'cosmos:aluminum_wire') {
					const side_connections = wire.permutation.getAllStates()
					side_connections[faces[5 - i]] = true
					neighbors[i].setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
					connections[faces[i]] = true
				}
				const machine = MachineInstances.get(dimension, wire.location).entity
				if (machine) {
					const [input, output] = get_machine_connections(machine)
					if (str(output) == str(location) || str(input) == str(location)) connections[faces[i]] = true
				}
			} event.permutationToPlace = BlockPermutation.resolve("cosmos:aluminum_wire", connections)
		},
		onPlayerDestroy(event) {
			detach_wires(event.block)
		}
	})
})