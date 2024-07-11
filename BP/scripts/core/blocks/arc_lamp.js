import {world} from "@minecraft/server";

/*function checkRedstonePower(block){
	let nearbyBlocks = [block.above(1), block.below(1), block.north(1), block.south(1), block.west(1), block.east(1), 'end']
	for(let nearbyBlocksRedstonePower of nearbyBlocks){
		if(nearbyBlocksRedstonePower != 'end' && nearbyBlocksRedstonePower != undefined && nearbyBlocksRedstonePower.getRedstonePower() > 0){
			console.warn('redstone active')
			return true; 
		}
		else if(nearbyBlocksRedstonePower === 'end'){
			console.warn('redstone not active')
			return false;
		}
	}
}*/
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
/*world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:arc_lamp', {
		onPlace({block}){
			console.warn('test')
		},
	})
})*/
