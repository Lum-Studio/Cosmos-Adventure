import { world, system, BlockPermutation} from "@minecraft/server"

const sides = ["above", "north", "east", "west", "south", "below"]
const faces = ["cosmos:up", "cosmos:north", "cosmos:east", "cosmos:west", "cosmos:south", "cosmos:down"]

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
    blockTypeRegistry.registerCustomComponent('cosmos:wire_placement', {
        beforeOnPlayerPlace(event) {
			const neighbors = sides.map(side => event.block[side]())
			const connections = {}
			for (let i in neighbors) {
				if (neighbors[i].typeId == 'cosmos:aluminum_wire') {
					const side_connections = neighbors[i].permutation.getAllStates()
					side_connections[faces[5-i]] = true
					neighbors[i].setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
					connections[faces[i]] = true
				}
			}
			event.permutationToPlace = BlockPermutation.resolve("cosmos:aluminum_wire", connections)
        },
        onPlayerDestroy(event) {
			const neighbors = sides.map(side => event.block[side]())
			for (let i in neighbors) {
				if (neighbors[i].typeId == 'cosmos:aluminum_wire') {
					const side_connections = neighbors[i].permutation.getAllStates()
					side_connections[faces[5-i]] = false
					neighbors[i].setPermutation(BlockPermutation.resolve("cosmos:aluminum_wire", side_connections))
				}
			}
        }
    })
})