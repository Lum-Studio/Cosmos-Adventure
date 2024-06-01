import { world, system, BlockPermutation} from "@minecraft/server"
import { get_machine_connections } from "../energy/electricity.js"
import AllMachineBlocks from "./AllMachineBlocks"
function str(object) { return JSON.stringify(object) }
function say(message='yes') {world.sendMessage(''+message)}

const sides = ["above", "north", "east", "west", "south", "below"]
const faces = ["cosmos:up", "cosmos:north", "cosmos:east", "cosmos:west", "cosmos:south", "cosmos:down"]


export function attach_wires(block, machine, direction=null) {
	const [input, output] = direction ? get_machine_connections(machine, direction) : get_machine_connections(machine)
	const neighbors = sides.map(side => block[side]())
	for (let i in neighbors) {
		const wire = neighbors[i]
		if (wire.typeId == 'cosmos:aluminum_wire' && ([str(output), str(input)].includes(str(wire.location)))) {
			const side_connections = wire.permutation.getAllStates()
			side_connections[faces[5-i]] = true
			wire.setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
		}
	}
}

export function detach_wires(wire) {
	const neighbors = sides.map(side => wire[side]())
	for (let i in neighbors) {
		if (neighbors[i].typeId == 'cosmos:aluminum_wire') {
			const side_connections = neighbors[i].permutation.getAllStates()
			side_connections[faces[5-i]] = false
			neighbors[i].setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
		}
	}
}

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
    blockTypeRegistry.registerCustomComponent('cosmos:wire_placement', {
        beforeOnPlayerPlace(event) {
			const {block} = event;
			const {location, dimension} = block;
			const neighbors = sides.map(side => event.block[side]())
			const connections = {}
			for (let i in neighbors) {
				if (neighbors[i].typeId == 'cosmos:aluminum_wire') {
					const side_connections = neighbors[i].permutation.getAllStates()
					side_connections[faces[5-i]] = true
					neighbors[i].setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
					connections[faces[i]] = true
				}
				const machine = dimension.getEntities({
					families: ["power"],
					location: neighbors[i].center(),
					maxDistance: 0.5
				})[0]
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