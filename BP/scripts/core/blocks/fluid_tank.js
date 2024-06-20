import { world, system, ItemStack, BlockPermutation, Block } from "@minecraft/server"

const buckets = new Map([
	["water", "minecraft:water_bucket"],
	["lava", "minecraft:lava_bucket"]
])
const fluids = new Map([
	["minecraft:water_bucket", "water"],
	["minecraft:lava_bucket", "lava"]
])
const liquids = new Map([
	["water", "minecraft:flowing_water"],
	["lava", "minecraft:flowing_lava"]
])
const pickup_sounds = new Map([
	["water", "bucket.fill_water"],
	["lava", "bucket.fill_lava"]
])
const empty_sounds = new Map([
	["minecraft:water_bucket", "bucket.empty_water"],
	["minecraft:lava_bucket", "bucket.empty_lava"]
])

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:fluid_tank', {
		onPlayerInteract({block, player, dimension}) {
			const tank = block.permutation
			const fill_level = tank.getState("cosmos:fill_level")
			const equipment = player.getComponent("minecraft:equippable")
			const item = equipment.getEquipment("Mainhand")

			if (fill_level) {
				const fluid = tank.getState("cosmos:fluid")
				const bucket = buckets.get(fluid)
				if (item?.typeId == "minecraft:bucket") {   //take fluid from the tank
					const sound = pickup_sounds.get(fluid)
					dimension.playSound(sound, block.location)
					block.setPermutation(tank.withState("cosmos:fill_level", fill_level - 1))
					if (item.amount == 1) equipment.setEquipment("Mainhand", new ItemStack(bucket))
					else {
						equipment.setEquipment("Mainhand", item.decrementStack())
						player.give(bucket)
					}
				}
				if (fill_level < 15 && item?.typeId == bucket) {   //add fluid to a tank
					const sound = empty_sounds.get(item.typeId)
					dimension.playSound(sound, block.location)
					block.setPermutation(tank.withState("cosmos:fill_level", fill_level + 1))
					if (item.amount == 1) {
						equipment.setEquipment("Mainhand", new ItemStack("bucket"))
					} else {
						equipment.setEquipment("Mainhand", item.decrementStack())
						player.give(bucket)
					}
				}
			} else if (fluids.has(item?.typeId)) {   //fill an empty tank
				const fluid = fluids.get(item.typeId)
				const sound = empty_sounds.get(item.typeId)
				dimension.playSound(sound, block.location)
				block.setPermutation(BlockPermutation.resolve("cosmos:fluid_tank", {"cosmos:fluid": fluid, "cosmos:fill_level": 1}))
				equipment.setEquipment("Mainhand", new ItemStack("bucket"))
			}
		},
		onPlayerDestroy({block, destroyedBlockPermutation:tank}) {
			if (!tank.getState("cosmos:fill_level")) return
			const liquid = liquids.get(tank.getState("cosmos:fluid"))
			block.setPermutation(BlockPermutation.resolve(liquid))
		}
	})
})