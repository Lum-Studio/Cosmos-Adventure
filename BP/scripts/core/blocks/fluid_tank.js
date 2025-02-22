import { world, ItemStack, BlockPermutation } from "@minecraft/server"
import { attach_pipes } from "./fluid_pipe"

const buckets = new Map([
	["water", "minecraft:water_bucket"],
	["lava", "minecraft:lava_bucket"],
	['oil', 'cosmos:oil_bucket'],
	['fuel', 'cosmos:fuel_bucket']
])
const fluids = new Map([
	["minecraft:water_bucket", "water"],
	["minecraft:lava_bucket", "lava"],
	['cosmos:oil_bucket', 'oil'],
	['cosmos:fuel_bucket', 'fuel']
])
const liquids = new Map([
	["water", "minecraft:flowing_water"],
	["lava", "minecraft:flowing_lava"],
	['oil', 'cosmos:oil'],
	['fuel', 'cosmos:fuel']
])
const pickup_sounds = new Map([
	["water", "bucket.fill_water"],
	["lava", "bucket.fill_lava"],
	["oil", "bucket.fill_water"],
	["fuel", "bucket.fill_water"],
])
const empty_sounds = new Map([
	["minecraft:water_bucket", "bucket.empty_water"],
	["minecraft:lava_bucket", "bucket.empty_lava"],
	["cosmos:oil_bucket", "bucket.empty_water"],
	["cosmos:fuel_bucket", "bucket.empty_water"],
])

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('cosmos:fluid_tank', {
		onPlayerInteract({ block, player, dimension }) {
			const tank = block.permutation
			const fill_level = tank.getState("cosmos:fill_level")
			const hand = player.hand()
			const itemType = hand.hasItem() && hand.typeId

			if (fill_level) {
				const fluid = tank.getState("cosmos:fluid")
				const bucket = buckets.get(fluid)
				if (itemType == "minecraft:bucket") {   //take fluid from the tank
					const sound = pickup_sounds.get(fluid)
					dimension.playSound(sound, block.location)
					block.setPermutation(tank.withState("cosmos:fill_level", fill_level - 1))
					if (hand.amount == 1) hand.setItem(new ItemStack(bucket))
					else {
						hand.amount--
						player.give(bucket)
					}
				}
				if (fill_level < 15 && itemType == bucket) {   //add fluid to a tank
					const sound = empty_sounds.get(itemType)
					dimension.playSound(sound, block.location)
					block.setPermutation(tank.withState("cosmos:fill_level", fill_level + 1))
					if (hand.amount == 1) {
						hand.setItem(new ItemStack(bucket))
					} else {
						hand.amount--
						player.give(bucket)
					}
				}
			} else if (fluids.has(itemType)) {   //fill an empty tank
				const fluid = fluids.get(itemType)
				const sound = empty_sounds.get(itemType)
				dimension.playSound(sound, block.location)
				block.setPermutation(BlockPermutation.resolve("cosmos:fluid_tank", { "cosmos:fluid": fluid, "cosmos:fill_level": 1 }))
				hand.setItem(new ItemStack("bucket"))
			}
		},
		onPlayerDestroy({ block, destroyedBlockPermutation: tank }) {
			attach_pipes(block, false)
			if (!tank.getState("cosmos:fill_level")) return
			const liquid = liquids.get(tank.getState("cosmos:fluid"))
			block.setPermutation(BlockPermutation.resolve(liquid))
		},
		onPlace({ block }) { attach_pipes(block) }
	})
})