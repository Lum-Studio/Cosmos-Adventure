import {world} from "@minecraft/server";

function place_machine(dimension, x,y,z, direction, block) {
	dimension.runCommand(`setblock ${x} ${y} ${z} air`)
	dimension.runCommand(`summon cosmos:${block} ${x} ${y} ${z} ${direction}`)
}

world.afterEvents.playerPlaceBlock.subscribe(({block, dimension, player}) => {
	const {x, y, z} = block.location
	const direction = Math.round((player.getRotation().y + 180) / 90) *90
    if ( block.permutation.matches("cosmos:coal_generator") ) place_machine(dimension, x,y,z, direction, 'coal_generator')
    if ( block.permutation.matches("cosmos:energy_storage_module") ) place_machine(dimension, x,y,z, direction, 'energy_storage_module')
    if ( block.permutation.matches("cosmos:energy_storage_cluster") ) place_machine(dimension, x,y,z, direction, 'energy_storage_cluster')
})

world.afterEvents.entityHurt.subscribe(({hurtEntity}) => {
	if ( hurtEntity.typeId.startsWith("cosmos:") ) hurtEntity.remove()
})