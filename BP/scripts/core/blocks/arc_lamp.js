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
	let nearbyBlocks = [block.above(1), block.below(1), block.north(1), block.south(1), block.west(1), block.east(1)]
	for(let nearbyBlocksSet of nearbyBlocks){
		if(nearbyBlocksSet != undefined && nearbyBlocksSet.typeId == 'cosmos:arc_lamp'){
			nearbyBlocksSet.setPermutation(nearbyBlocksSet.permutation.withState('cosmos:lamp_active', !nearbyBlocksSet.permutation.getState('cosmos:lamp_active')))
		}
	}
}
let buttons = [
	"minecraft:stone_button", 
	"minecraft:wooden_button", 
	"minecraft:spruce_button", 
	"minecraft:birch_button", 
	"minecraft:jungle_button", 
	"minecraft:acacia_button", 
	"minecraft:dark_oak_button", 
	"minecraft:crimson_button", 
	"minecraft:warped_button",
	"minecraft:polished_blackstone_button"
]
world.afterEvents.playerInteractWithBlock.subscribe((data) => {
	if(buttons.includes(data.block.typeId)) checkBlocks(data.block);
})
/*world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:arc_lamp', {
		onPlace({block}){
			console.warn('test')
		},
	})
})*/