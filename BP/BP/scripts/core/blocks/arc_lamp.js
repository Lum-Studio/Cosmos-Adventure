import {world} from "@minecraft/server";

function checkBlocks(block){
	const nearbyBlocks = block.getNeighbors(6);
	for (const nearbyBlocksSet of nearbyBlocks){
		if (nearbyBlocksSet != undefined && nearbyBlocksSet.typeId == 'cosmos:arc_lamp'){
			nearbyBlocksSet.setPermutation(nearbyBlocksSet.permutation.withState('cosmos:lamp_active', !nearbyBlocksSet.permutation.getState('cosmos:lamp_active')))
		}
	}
}

world.afterEvents.playerInteractWithBlock.subscribe(({ block }) => {
	if(/minecraft:.+_button/.test(block.typeId)) checkBlocks(block);
})
