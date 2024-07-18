import {world} from "@minecraft/server";

function grappleProjectileStop(projectile){
    let owner = world.getEntity(projectile.getDynamicProperty('owner'))
	let generalProjectile = owner.dimension.spawnEntity('cosmos:gengrapple', {x: owner.location.x, y: owner.location.y + 1, z: owner.location.z});
    let dirLenght = 1/Math.sqrt(((projectile.location.x - owner.location.x) * (projectile.location.x - owner.location.x)) + ((projectile.location.y - owner.location.y) * (projectile.location.y - owner.location.y)) + ((projectile.location.z - owner.location.z) * (projectile.location.z - owner.location.z)));
    let direction = {x: (projectile.location.x - owner.location.x) * dirLenght, y: (projectile.location.y - owner.location.y) * dirLenght, z: (projectile.location.z - owner.location.z) * dirLenght};
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
    if(data.projectile.typeId === 'cosmos:vgrapple') grappleProjectileStop(data.projectile);
    if(data.projectile.typeId === 'cosmos:gengrapple') {
        data.projectile.getComponent('minecraft:rideable').ejectRiders();
        try {world.getEntity(data.projectile.getDynamicProperty('generalGrappleProjectile')).triggerEvent("cosmos:despawn"), data.projectile.triggerEvent("cosmos:despawn")} catch(error) {null};
    }
});