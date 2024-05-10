import {world} from "@minecraft/server";

function place_machine(dimension, location, direction, name) {
	const {x, y, z} = location
	dimension.runCommand(`setblock ${x} ${y} ${z} air`)
	dimension.runCommand(`summon cosmos:${name} ${x} ${y} ${z} ${direction}`)
}

world.afterEvents.playerPlaceBlock.subscribe(({block, dimension, player}) => {
	const direction = Math.round((player.getRotation().y + 180) / 90)*90
	const location = block.location
    if ( block.permutation.matches("cosmos:coal_generator") ) place_machine(dimension, location, direction, 'coal_generator')
    if ( block.permutation.matches("cosmos:energy_storage_module") ) place_machine(dimension, location, direction, 'energy_storage_module')
    if ( block.permutation.matches("cosmos:energy_storage_cluster") ) place_machine(dimension, location, direction, 'energy_storage_cluster')
})

world.afterEvents.entityHurt.subscribe(({hurtEntity}) => {
	if ( hurtEntity.typeId.startsWith("cosmos:") ) hurtEntity.remove()
})