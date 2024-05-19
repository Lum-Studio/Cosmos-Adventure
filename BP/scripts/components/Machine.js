import { world, system, BlockPermutation } from "@minecraft/server"
import AllMachineBlocks from "../core/machines/AllMachineBlocks"
import { MachineInstances } from "../core/machines/MachineInstances"

const directions = ['south', 'west', 'north', 'east']

world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:machine', {
		beforeOnPlayerPlace (event) {
			const { block, dimension, player, permutationToPlace } = event
			const machineType = AllMachineBlocks[permutationToPlace.type.id]
			const entity = dimension.spawnEntity(machineType.tileEntity, { ...block.center(), y: block.y })
			const location = block.location
			const playerRotaion = Math.round((player.getRotation().y + 180) / 90)
			const direction = directions[playerRotaion == 4 ? 0 : playerRotaion]
			entity.setProperty("cosmos:direction", direction)
			event.permutationToPlace = BlockPermutation.resolve('minecraft:air')
			if ( machineType.class ) {
				MachineInstances.add(dimension, location, new machineType.class(block, entity))
			}
		}
	})
})

world.afterEvents.entityHurt.subscribe(({ hurtEntity }) => {
	if (hurtEntity && hurtEntity.typeId.startsWith("cosmos:")) MachineInstances.get(hurtEntity.dimension, hurtEntity.location)?.destroy()
})