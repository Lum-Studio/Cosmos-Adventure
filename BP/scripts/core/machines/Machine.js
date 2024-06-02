import { world, system, BlockPermutation } from "@minecraft/server"
import machines from "./AllMachineBlocks"
import { MachineInstances } from "./MachineInstances"
import { detach_wires, attach_wires } from "./wire_placement"
function str(object) { return JSON.stringify(object) }
function say(message='yes') {world.sendMessage(''+message)}

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
			const machineType = machines[block_id.replace('cosmos:', '')]
			const entity = dimension.spawnEntity(machineType.tileEntity, { ...block.center(), y: block.y })
			const location = block.location
			const playerRotaion = Math.round((player.getRotation().y + 180) / 90)
			const direction = directions[playerRotaion == 4 ? 0 : playerRotaion]
			entity.setProperty("cosmos:direction", direction)
			entity.nameTag = machineType.ui
			if (["cosmos:energy_storage_module", "cosmos:energy_storage_cluster"].includes(block_id)) event.permutationToPlace = BlockPermutation.resolve(block_id, {"cosmos:full": false, "minecraft:cardinal_direction": direction})
			if ( machineType.class ) MachineInstances.add(dimension, location, new machineType.class(block, entity))
			attach_wires(block, entity, direction)
			
		},
		onPlayerDestroy ({block, dimension}) {
			detach_wires(block)
			const entity = dimension.getEntities({location: block.center(), distance: 0.5, families: ["cosmos"]})[0]
			MachineInstances.get(dimension, entity?.location)?.destroy()
			if (entity) {
				const container = entity.getComponent('minecraft:inventory').container
				for (let i=0; i<container.size; i++) {
					if (container.getItem(i)?.typeId == 'cosmos:ui') {
						container.setItem(i, undefined)
					}
				}
				entity.runCommand('kill @s')
				entity.triggerEvent('cosmos:despawn')
			}
		}
	})
})

//access for block
system.runInterval(()=> {
	const players = world.getAllPlayers()
	players.forEach(player => {
		const mainHand = player.getComponent("minecraft:equippable").getEquipment("Mainhand")
		if (!pickaxes.has(mainHand?.typeId) && !(player.isSneaking && mainHand)) return //is holding a pickaxe or holding an item while sneaking
		const block = player.getBlockFromViewDirection( {
			blockFilter: {
				includeTypes: Object.keys(machines).map(m=> 'cosmos:' + m)
			}, maxDistance: 6
		})?.block
		const entity = block ? block.dimension.getEntitiesAtBlockLocation(block.location)[0] : player.getEntitiesFromViewDirection({maxDistance: 6})[0]?.entity
		if (entity?.typeId.startsWith("cosmos:machine:")) entity.triggerEvent("cosmos:shrink")
	})
})

//on load
world.afterEvents.entityLoad.subscribe(({entity})=> {
	const id = entity.typeId
	if (!id.startsWith('cosmos:machine:')) return
	const dimension = entity.dimension
	const block = dimension.getBlock(entity.location)
	const location = block.location
	const machineType = machines[id.replace('cosmos:machine:', '')]
	if ( machineType.class ) MachineInstances.add(dimension, location, new machineType.class(block, entity))
})

//on reload
const dimensions = new Set()
world.getAllPlayers().forEach(player => dimensions.add(player.dimension))
dimensions.forEach(dimension => dimension.getEntities().forEach(entity => {
	const id = entity.typeId
	if (!id.startsWith('cosmos:machine:')) return
	const block = dimension.getBlock(entity.location)
	const location = block.location
	const machineType = machines[id.replace('cosmos:machine:', '')]
	if ( machineType.class ) MachineInstances.add(dimension, location, new machineType.class(block, entity))
}))