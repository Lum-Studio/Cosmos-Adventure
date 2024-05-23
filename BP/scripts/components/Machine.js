import { world, system, BlockPermutation } from "@minecraft/server"
import AllMachineBlocks from "../core/machines/AllMachineBlocks"
import { MachineInstances } from "../core/machines/MachineInstances"

const directions = ['south', 'west', 'north', 'east']
const pickaxes = new Set([
	"minecraft:wooden_pickaxe",
	"minecraft:stone_pickaxe",
	"minecraft:iron_pickaxe",
	"minecraft:golden_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:machine', {
		beforeOnPlayerPlace (event) {
			const { block, dimension, player, permutationToPlace } = event
			const block_id = permutationToPlace.type.id
			const machineType = AllMachineBlocks[block_id]
			const entity = dimension.spawnEntity(machineType.tileEntity, { ...block.center(), y: block.y })
			const location = block.location
			const playerRotaion = Math.round((player.getRotation().y + 180) / 90)
			const direction = directions[playerRotaion == 4 ? 0 : playerRotaion]
			entity.setProperty("cosmos:direction", direction)
			event.permutationToPlace = BlockPermutation.resolve(block_id, {"cosmos:invisible": true})
			if ( machineType.class ) {
				MachineInstances.add(dimension, location, new machineType.class(block, entity))
			}
		},
		onPlayerDestroy ({block, dimension}) {
			const entity = dimension.getEntitiesAtBlockLocation(block.location)[0]
			MachineInstances.get(dimension, entity.location)?.destroy()
			if (entity) {
				const container = entity.getComponent('minecraft:inventory').container
				const data_slots = AllMachineBlocks[entity.typeId].slots
				Object.values(data_slots).forEach(slot => container.setItem(slot, undefined))
				
				entity.runCommand('kill @s')
				entity.runCommand('tp  ~ -64 ~')  //I will replace this line with a proper death animation later
			}
		}
	})
})

system.runInterval(()=> {
	const players = world.getAllPlayers()
	players.forEach(player => {
		const mainHand = player.getComponent("minecraft:equippable").getEquipment("Mainhand")
		if (!pickaxes.has(mainHand?.typeId) && !(player.isSneaking && mainHand)) return //is holding a pickaxe or holding an item while sneaking
		const block = player.getBlockFromViewDirection({blockFilter: {includeTypes: Object.keys(AllMachineBlocks)}, maxDistance: 6})?.block
		const entity = block ? block.dimension.getEntitiesAtBlockLocation(block.location)[0] : player.getEntitiesFromViewDirection({maxDistance: 6})[0]?.entity
		if (entity?.typeId.startsWith("cosmos:")) entity.triggerEvent("cosmos:shrink")
	})
})