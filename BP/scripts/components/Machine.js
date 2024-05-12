import { world, system} from "@minecraft/server"
import AllMachineBlocks from "../core/machines/AllMachineBlocks"
import { MachineInstances } from "../core/machines/MachineInstances"


world.beforeEvents.worldInitialize.subscribe(({ blockTypeRegistry }) => {
    blockTypeRegistry.registerCustomComponent('cosmos:machine', {
        beforeOnPlayerPlace({ player, permutationToPlace, block, dimension }) {
            const machineType = AllMachineBlocks[permutationToPlace.type.id]
            const direction = Math.round((player.getRotation().y + 180) / 90) * 90
            const location = block.location;
            const { x, y, z } = location
            system.run(()=> {
				dimension.setBlockType(location, 'minecraft:air')
			})
			dimension.runCommand(`summon ${machineType.tileEntity} ${x} ${y} ${z} ${direction}`)
            MachineInstances.add(dimension, location, new machineType.class(block, dimension.getEntities({ location: block.center() })[0]))
        },
        onPlayerDestroy({ block, dimension }) {
            MachineInstances.get(dimension, block.location).destroy();
        }
    })
})