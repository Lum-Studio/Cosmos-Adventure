import {world} from "@minecraft/server";

function grappleProjectileStop(location, projectile){
    let owner = world.getEntity(projectile.getDynamicProperty('owner'))
	let generalProjectile = owner.dimension.spawnEntity('cosmos:generalGrappleProjectile', owner.location);
    let direction = {x: location.x - owner.location.x, y: location.y - owner.location.y, z: location.z - owner.location.z};
    generalProjectile.getComponent('minecraft:rideable').addRider(owner);
    generalProjectile.getComponent('minecraft:projectile').shoot(direction);
    projectile.setDynamicProperty('generalGrappleProjectile', generalProjectile.id);
    //this function made for launching projectile with player to hook position|эта функция нужна для запуска снаряда с игроком к позиции крюка
}
world.beforeEvents.worldInitialize.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("cosmos:grapple", {
        onCompleteUse(data){
            let visualProjectile = data.source.dimension.spawnEntity('cosmos:visuallGrappleProjectile', data.source.location);
            visualProjectile.getComponent('minecraft:projectile').shoot(data.source.getViewDirection());
            visualProjectile.setDynamicProperty('owner', data.source.id);
        },
    })
})
world.afterEvents.projectileHitBlock.subscribe((data) => {
    if(data.projectile.typeId != 'cosmos:visuallGrappleProjectile' && data.projectile.typeId != 'cosmos:generalGrappleProjectile') return;
    if(data.projectile.typeId === 'cosmos:visuallGrappleProjectile') grappleProjectileStop(data.location, data.projectile);
    if(data.projectile.typeId === 'cosmos:generalGrappleProjectile') try {world.getEntity(data.projectile.getDynamicProperty('generalGrappleProjectile')).triggerEvent("cosmos:despawn"), data.projectile.triggerEvent("cosmos:despawn")} catch(error) {null}
});