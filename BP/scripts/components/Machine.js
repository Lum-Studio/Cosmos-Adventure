import { world, system } from "@minecraft/server"
import AllMachineBlocks from "../core/machines/AllMachineBlocks"
import { MachineInstances } from "../core/machines/MachineInstances"
import { cardinalToDirectionInt } from "../api/utilities/Direction"


world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
    blockTypeRegistry.registerCustomComponent('cosmos:machine', {
        onPlace({ block, dimension }) {
            const machineType = AllMachineBlocks[block.typeId]
            const entity = dimension.spawnEntity(machineType.tileEntity, { ...block.center(), y: block.y })
            const location = block.location
            dimension.setBlockType(location, 'minecraft:air')
            MachineInstances.add(dimension, location, new machineType.class(block, entity))
        }
    })
})

world.afterEvents.entityHurt.subscribe(({ hurtEntity }) => {
    if (hurtEntity && hurtEntity.typeId.startsWith("cosmos:")) MachineInstances.get(hurtEntity.dimension, hurtEntity.location)?.destroy()
})