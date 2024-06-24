import { world, BlockPermutation } from "@minecraft/server"
import machines from "./AllMachineBlocks"
import { MachineInstances } from "./MachineInstances"
import { detach_wires, attach_wires } from "../blocks/aluminum_wire"
import { pickaxes } from "../../api/utils"
function str(object) { return JSON.stringify(object) }

const directions = ['south', 'west', 'north', 'east']
world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
	blockTypeRegistry.registerCustomComponent('cosmos:machine', {
		beforeOnPlayerPlace(event) {
			const { block, dimension, player, permutationToPlace } = event
			const block_id = permutationToPlace.type.id  //please look where else was this variable used before modifing it (used twice in line 29)
			const machineType = machines[block_id.replace('cosmos:', '')]
			const entity = dimension.spawnEntity(machineType.tileEntity, { ...block.center(), y: block.y })
			const location = block.location
			const playerRotaion = Math.round((player.getRotation().y + 180) / 90)
			const direction = directions[playerRotaion == 4 ? 0 : playerRotaion]
			entity.setProperty("cosmos:direction", direction)
			entity.nameTag = machineType.ui
			if (["cosmos:energy_storage_module", "cosmos:energy_storage_cluster"].includes(block_id)) event.permutationToPlace = BlockPermutation.resolve(block_id, { "cosmos:full": false, "minecraft:cardinal_direction": direction })
			if (machineType.class) MachineInstances.add(dimension, location, new machineType.class(block, entity))
			attach_wires(block, entity, direction)
		},
		onPlayerDestroy({ block, dimension }) {
			detach_wires(block)
			MachineInstances.get(dimension, block?.location)?.destroy()
		},
		onTick({ block, dimension }) {
			const nearbyPlayers = dimension.getPlayers({ location: block.location, maxDistance: 7 });
			nearbyPlayers.forEach(player => {
				const mainHand = player.getComponent("minecraft:equippable").getEquipment("Mainhand")
				if (!pickaxes.has(mainHand?.typeId) && !(player.isSneaking && mainHand)) return;
				const view_block = player.getBlockFromViewDirection()?.block //this is used to make the machine accessable if a player is holding a pickaxe or sneaking near the machine but not looking at it.
				if (str(block.location) != str(view_block.location)) return;

				const entity = MachineInstances.get(dimension, block.location)?.entity 
				if (entity?.typeId.startsWith("cosmos:machine:")) entity.triggerEvent("cosmos:shrink")
			})
		}
	})
})


//on load
world.afterEvents.entityLoad.subscribe(({ entity }) => {
	const id = entity.typeId
	if (!id.startsWith('cosmos:machine:')) return
	const dimension = entity.dimension
	const block = dimension.getBlock(entity.location)
	const location = block.location
	const machineType = machines[id.replace('cosmos:machine:', '')]
	if (machineType.class) MachineInstances.add(dimension, location, new machineType.class(block, entity))
})


world.afterEvents.worldInitialize.subscribe(() => {
	world.getDims((dimension) => dimension.getEntities()).forEach(entity => {
		const id = entity?.typeId
		if (!id.startsWith('cosmos:machine:')) return
		const block = entity.dimension.getBlock(entity.location)
		const location = block.location
		const machineType = machines[id.replace('cosmos:machine:', '')]
		if (machineType.class) MachineInstances.add(entity.dimension, location, new machineType.class(block, entity))
	})
})
