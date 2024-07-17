import {world} from "@minecraft/server";

function grappleProjectileStop(source, location){
	let generalProjectile = source.dimension.spawnEntity('cosmos:generalGrappleProjectile', source.location);
    let direction = {x: location.x - source.location.x, y: location.y - source.location.y, z: location.z - source.location.z};
    generalProjectile.getComponent('minecraft:rideable').addRider(source);
    generalProjectile.getComponent('minecraft:projectile').shoot(direction);
    //this function made for launching projectile with player to hook position|эта функция нужна для запуска снаряда с игроком к позиции крюка
}
world.afterEvents.projectileHitBlock.subscribe((data) => {
    if(data.projectile.typeId != 'cosmos:visuallGrappleProjectile') return;
    grappleProjectileStop(data.source, data.location);
});