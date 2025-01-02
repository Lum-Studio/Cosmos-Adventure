import { world, system } from "@minecraft/server"
import machines from "./AllMachineBlocks"
import { MachineInstances } from "./MachineInstances"
import { detach_wires, attach_to_wires } from "../blocks/aluminum_wire"
import { pickaxes } from "../../api/utils"
import { compare_position } from "../matter/electricity"

// this function shrinks the machine to give the player access to the block if:
// - The player is holding a pickaxe or a wrench OR The player is sneaking 
// - The is looking at the block 
function block_entity_access(block, entity) {
	block.dimension.getPlayers({ location: block.center(), maxDistance: 6 }).forEach(player => {
		const view_block = player.getBlockFromViewDirection()?.block
		if (!compare_position(block?.location, view_block?.location)) return
		const sneaking = player.isSneaking
		const item = player.getComponent("minecraft:equippable").getEquipment("Mainhand")?.typeId
		const has_pickaxe = pickaxes.has(item)
		const has_wrench = item == "cosmos:standard_wrench"
		if (sneaking || has_pickaxe || has_wrench) entity.triggerEvent("cosmos:shrink")
	})
}

system.runInterval(() => {
	MachineInstances.instances.forEach((machine) => {
		const machineType = machines[machine.typeId]
		block_entity_access(machine.block, machine.entity)
		new (machineType.class)(machine.block, machine.entity)
	})
})

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
	blockComponentRegistry.registerCustomComponent('cosmos:machine', {
		beforeOnPlayerPlace(event) {
			const { block, dimension, permutationToPlace: perm } = event
			const block_id = perm.type.id
			const machineType = machines[block_id.replace('cosmos:', '')]
			const entity = dimension.spawnEntity(machineType.tileEntity, { ...block.center(), y: block.y })
			entity.nameTag = machineType.ui
			if (perm.getState("cosmos:full")) event.permutationToPlace = perm.withState("cosmos:full", false)
			if (machineType.class) MachineInstances.add(dimension, block.location, new machineType.class(block, entity))
			system.run(() => attach_to_wires(block))
		},
		onPlayerDestroy({ block, dimension }) {
			detach_wires(block)
			// obtain the entity before deleting the instance
			const entity = MachineInstances.get(dimension, block.location)?.entity
			MachineInstances.destroy(dimension, block.location)
			// check if the entity exists
			if (!entity) return
			// clear the ui items before killing the entity
			const container = entity.getComponent('minecraft:inventory')?.container
			if (container) { for (let i = 0; i < container.size; i++) {
				const itemId = container.getItem(i)?.typeId
				if (!['cosmos:ui', 'cosmos:ui_button'].includes(itemId)) continue
				container.setItem(i)
			}}
			// kill the entity to make it drop it's items
			entity.runCommand('kill @s')
			// removing the entity because it is immortal
			entity.remove()
		}
	})
})


//on load
world.afterEvents.entityLoad.subscribe(({entity}) => {
	const {typeId:id, dimension, location} = entity
	if (!id.startsWith('cosmos:machine:')) return
	const block = dimension.getBlock(location)
	const machineType = machines[id.replace('cosmos:machine:', '')]
	if (block.typeId != machineType.tileEntity.replace('cosmos:machine:', 'cosmos:')) {entity.remove(); return}
	if (machineType.class) MachineInstances.add(dimension, block.location, new machineType.class(block, entity))
})

//on reload
world.afterEvents.worldInitialize.subscribe(() => {
	world.getDims((dimension) => dimension.getEntities()).forEach(entity => {
		const id = entity?.typeId
		if (!id.startsWith('cosmos:machine:')) return
		const block = entity.dimension.getBlock(entity.location)
		const location = block.location
		const machineType = machines[id.replace('cosmos:machine:', '')]
		if (block.typeId != machineType.tileEntity.replace('cosmos:machine:', 'cosmos:')) {entity.remove(); return}
		if (machineType.class) MachineInstances.add(entity.dimension, location, new machineType.class(block, entity))
	})
})
