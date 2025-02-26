import { BlockPermutation, world } from "@minecraft/server";


function neighbors_stairs(block) {
	const perm = block.permutation
	const half = perm.getState("minecraft:vertical_half")
	return ["north", "east", "south", "west"].map(side =>
		block[side]()
	).map(stair =>
		(stair.permutation.hasTag('stairs') && stair.permutation.getState('minecraft:vertical_half') == half) ? stair :
			(stair.typeId.includes('stairs') && stair.permutation.getState('upside_down_bit') == (half == 'top')) ? stair :
				undefined
	).map(stair =>
		stair?.permutation.hasTag('stairs') ? stair.permutation.getState("minecraft:cardinal_direction") : stair ? ["east", "west", "south", "north"][stair.permutation.getState("weirdo_direction")] : undefined
	)
}

function set_corners(direction, [north, east, south, west]) {
	let [north_east, north_west, south_east, south_west] = [false, false, false, false]
	switch (direction) {
		case 'north': {
			north_east = !(north == 'west')
			north_west = !(north == 'east')
			south_east = (south == 'east') && !['west', 'east'].includes(north)
			south_west = (south == 'west') && !['west', 'east'].includes(north)
			break;
		}
		case 'east': {
			north_east = !(east == 'south')
			north_west = (west == 'north') && !['north', 'south'].includes(east)
			south_east = !(east == 'north')
			south_west = (west == 'south') && !['north', 'south'].includes(east)
			break;
		}
		case 'south': {
			north_east = (north == 'east') && !['west', 'east'].includes(south)
			north_west = (north == 'west') && !['west', 'east'].includes(south)
			south_east = !(south == 'west')
			south_west = !(south == 'east')
			break;
		}
		case 'west': {
			north_east = (east == 'north') && !['north', 'south'].includes(west)
			north_west = !(west == 'south')
			south_east = (east == 'south') && !['north', 'south'].includes(west)
			south_west = !(west == 'north')
			break;
		}
	}
	return [north_east, north_west, south_east, south_west]
}

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {

	const { resolve } = BlockPermutation

	blockComponentRegistry.registerCustomComponent('cosmos:stairs', {
		beforeOnPlayerPlace(event) {
			const perm = event.permutationToPlace
			const states = perm.getAllStates()
			const direction = states["minecraft:cardinal_direction"]
			states["generic:north_east"] = ["north", "east"].includes(direction)
			states["generic:north_west"] = ["north", "west"].includes(direction)
			states["generic:south_east"] = ["south", "east"].includes(direction)
			states["generic:south_west"] = ["south", "west"].includes(direction)
			event.permutationToPlace = resolve(perm.type.id, states)
		},
		onTick({ block }) {
			if (!block.hasTag("stairs")) return
			const perm = block.permutation
			const states = perm.getAllStates()
			const direction = states["minecraft:cardinal_direction"]
			const [north_east, north_west, south_east, south_west] = set_corners(direction, neighbors_stairs(block))
			states["generic:north_east"] = north_east
			states["generic:north_west"] = north_west
			states["generic:south_east"] = south_east
			states["generic:south_west"] = south_west
			block.setPermutation(resolve(perm.type.id, states))
		}
	});
});
