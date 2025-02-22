import { BlockPermutation, world } from "@minecraft/server";

{
	const sides = ['north', 'east', 'south', 'west']
	var updateStates = (block, tag, states) => {
		return sides.reduce((s, side) => (s[`generic:${side}_wall`] = block[side]().hasTag(tag), s), states)

	}
};

//system.beforeEvents.startUp.subscribe		in 2.0.0
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	const { resolve } = BlockPermutation
	blockComponentRegistry.registerCustomComponent("cosmos:wall", {
		beforeOnPlayerPlace(event) {
			const { block, permutationToPlace: perm } = event
			event.permutationToPlace = resolve(
				perm.type.id,
				updateStates(block, "wall", perm.getAllStates())
			)
		},
		onTick({ block }) {
			block.setPermutation(resolve(
				block.typeId,
				updateStates(block, "wall", block.permutation.getAllStates())
			))
		}
	});
});
