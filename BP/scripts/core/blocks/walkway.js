import { world, system, BlockPermutation } from "@minecraft/server"
import { opposite_side, same_side } from "./aluminum_wire"
import { four_neighbors } from "../../api/utils"


export const walkway_component = {
	onPlace({block: walkway_block}) {
		const neighbors = four_neighbors(walkway_block)
	    const states = {}
	    for (const [side, block] of Object.entries(neighbors)) {
			if(walkway_block.typeId == block.typeId) {
				block.setPermutation(block.permutation.withState(opposite_side[side], true))
				states[same_side[side]] = true
		    }
	    }
	    walkway_block.setPermutation(BlockPermutation.resolve(walkway_block.typeId, states))
	},
	onPlayerBreak({block}){
		const neighbors = four_neighbors(block)
		for (const side in neighbors) {
			const neighbor = neighbors[side]
			if (neighbor.typeId != "cosmos:walkway") continue
			neighbor.setPermutation(neighbor.permutation.withState(opposite_side[side], false))
		}
	}
}