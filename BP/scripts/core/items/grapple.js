import {world} from "@minecraft/server";

function grappleProjectileStop(location, projectile){
    let owner = world.getEntity(projectile.getDynamicProperty('owner'))
	let generalProjectile = owner.dimension.spawnEntity('cosmos:gengrapple', owner.location);
    let dirLenght = 1/Math.sqrt(((location.x - owner.location.x) * (location.x - owner.location.x)) + ((location.y - owner.location.y) * (location.y - owner.location.y)) + ((location.z - owner.location.z) * (location.z - owner.location.z)));
    let direction = {x: (location.x - owner.location.x) * dirLenght, y: (location.y - owner.location.y) * dirLenght, z: (location.z - owner.location.z) * dirLenght};
    generalProjectile.getComponent('minecraft:rideable').addRider(owner);
    generalProjectile.getComponent('minecraft:projectile').shoot(direction);
    projectile.setDynamicProperty('generalGrappleProjectile', generalProjectile.id);
    //this function made for launching projectile with player to hook position|эта функция нужна для запуска снаряда с игроком к позиции крюка
}
world.beforeEvents.worldInitialize.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("cosmos:grapple", {
        onUse(data){
            let visualProjectile = data.source.dimension.spawnEntity('cosmos:vgrapple', data.source.location);
            visualProjectile.getComponent('minecraft:projectile').shoot(data.source.getViewDirection());
            visualProjectile.setDynamicProperty('owner', data.source.id);
        },
    })
})
world.afterEvents.projectileHitBlock.subscribe((data) => {
    if(data.projectile.typeId != 'cosmos:vgrapple' && data.projectile.typeId != 'cosmos:gengrapple') return;
    if(data.projectile.typeId === 'cosmos:vgrapple') grappleProjectileStop(data.location, data.projectile);
    if(data.projectile.typeId === 'cosmos:gengrapple') {
        data.projectile.getComponent('minecraft:rideable').ejectRiders();
        try {world.getEntity(data.projectile.getDynamicProperty('generalGrappleProjectile')).triggerEvent("cosmos:despawn"), data.projectile.triggerEvent("cosmos:despawn")} catch(error) {null};
    }
});