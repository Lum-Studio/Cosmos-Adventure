import { system, world, BlockPermutation } from "@minecraft/server"
import { pickaxes } from "../../api/utils"

const stone_tier = new Set([
	"minecraft:stone_pickaxe",
	"minecraft:iron_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])

const iron_tier = new Set([
	"minecraft:iron_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])

const diamond_tier = new Set([
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])

function wrong_tool(block, item) {
	return ((block = block.getTags()).includes("require_pickaxe") && !pickaxes.has(item))
	|| (block.includes("require_stone_pickaxe") && !stone_tier.has(item))
	|| (block.includes("require_iron_pickaxe") && !iron_tier.has(item))
	|| (block.includes("require_diamond_pickaxe") && !diamond_tier.has(item))
}


//if the block should drop items or not
world.beforeEvents.playerBreakBlock.subscribe((event) => {
	const {block, dimension, player, itemStack} = event
	const item = itemStack?.typeId
	
	if (!(player.getGameMode() == "creative") && wrong_tool(block, item)) {
		event.cancel = true
		system.run(()=>{
			dimension.playSound("dig.stone", block.location)
			//will be replaced by a custom particle later
			//dimension.spawnParticle("minecraft:block_destruct", block.center())
			block.setPermutation(BlockPermutation.resolve("air"))
		})
	}
})

//durability system
world.afterEvents.playerBreakBlock.subscribe(({brokenBlockPermutation:block, itemStackBeforeBreak:item, player}) => {
	if (!item || !block.hasTag("take_durability")) return
	const unbreaking = item.getComponent('enchantable')?.getEnchantment('unbreaking')?.level ?? 0
	const durability = item.getComponent('durability')
	if (!durability) return
	if (Math.random() * (unbreaking + 1) >= 1) return
	const breaks = durability.maxDurability == durability.damage
	if (breaks) {
		item = undefined
		player.dimension.playSound('random.break', player.location)
	} else durability.damage++
	player.hand(item)
})

// to remove the item model
world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent("cosmos:placed", {
        beforeOnPlayerPlace(e){
            e.permutationToPlace = e.permutationToPlace.withState("cosmos:placed", true);
        },
    });
})


//determines how fast the block will take to mine
system.runInterval(()=> {
	world.getAllPlayers().forEach(player => {
		const item = player.hand().hasItem() && player.hand()?.typeId
		const block = player.getBlockFromViewDirection({
			includeTags: ["require_pickaxe", "require_stone_pickaxe", "require_iron_pickaxe", "require_diamond_pickaxe"],
			maxDistance: 7
		})?.block
		if (!block) return
		const permutation = block.permutation
		if (wrong_tool(block, item)) block.setPermutation(permutation.withState("cosmos:mining_speed", "slow"))
		else if (item == "minecraft:wooden_pickaxe")
			block.setPermutation(permutation.withState("cosmos:mining_speed", "decreased"))
		else if ("minecraft:golden_pickaxe minecraft:stone_pickaxe".includes(item))
			block.setPermutation(permutation.withState("cosmos:mining_speed", "normal"))
		else if (item == "minecraft:iron_pickaxe")
			block.setPermutation(permutation.withState("cosmos:mining_speed", "fast"))
		else if ("minecraft:diamond_pickaxe minecraft:netherite_pickaxe".includes(item))
			block.setPermutation(permutation.withState("cosmos:mining_speed", "rapid"))
	})
}, 2)