import {world, system} from "@minecraft/server";

function grappleProjectileStop(projectile){
    let owner = world.getEntity(projectile.getDynamicProperty('owner'))
	let generalProjectile = owner.dimension.spawnEntity('cosmos:gengrapple', {x: owner.location.x, y: owner.location.y + 1, z: owner.location.z});
    let dirLenght = 1/Math.sqrt(((projectile.location.x - owner.location.x) ** 2) + ((projectile.location.y - (owner.location.y + 1)) ** 2) + ((projectile.location.z - owner.location.z) ** 2));
    let direction = {x: (projectile.location.x - owner.location.x) * dirLenght, y: (projectile.location.y - (owner.location.y + 1)) * dirLenght, z: (projectile.location.z - owner.location.z) * dirLenght};
    generalProjectile.getComponent('minecraft:rideable').addRider(owner);
    generalProjectile.getComponent('minecraft:projectile').shoot(direction);
    projectile.setDynamicProperty('generalGrappleProjectile', generalProjectile.id);
    //this function made for launching projectile with player to hook position|эта функция нужна для запуска снаряда с игроком к позиции крюка
}
function grappleProjectileFlying(projectile){
    let owner = world.getEntity(projectile.getDynamicProperty('owner'))
	let generalProjectile = owner.dimension.spawnEntity('cosmos:gengrapple', {x: owner.location.x, y: owner.location.y + 1, z: owner.location.z});
    generalProjectile.setDynamicProperty('stopLocation', projectile.location);
    let projectileLocation = generalProjectile.getDynamicProperty('stopLocation');
    generalProjectile.getComponent('minecraft:rideable').addRider(owner);
    let fly = system.runInterval(() => {
        if(!projectile.isValid() && !generalProjectile.isValid()) system.clearRun(fly);
        let targetBlock = (generalProjectile.isValid() || generalProjectile.dimension.getBlockFromRay(generalProjectile.location, {x: (projectileLocation.x - generalProjectile.location.x), y: (projectileLocation.y - generalProjectile.location.y), z: (projectileLocation.z - generalProjectile.location.z)})?.block != undefined)? generalProjectile.dimension.getBlockFromRay(generalProjectile.location, {x: (projectileLocation.x - generalProjectile.location.x), y: (projectileLocation.y - generalProjectile.location.y), z: (projectileLocation.z - generalProjectile.location.z)})?.block.location:
        projectileLocation;
        let cof = (targetBlock == undefined)? 1: 
        (Math.abs(targetBlock.x - generalProjectile.location.x) <= 3 && Math.abs(targetBlock.y - generalProjectile.location.y) <= 3 && Math.abs(targetBlock.z - generalProjectile.location.z) <= 3)? 0.5:
        (Math.abs(targetBlock.x - generalProjectile.location.x) <= 1.5 && Math.abs(targetBlock.y - generalProjectile.location.y) <= 1.5 && Math.abs(targetBlock.z - generalProjectile.location.z) <= 1.5)? 0.25:
        (Math.abs(targetBlock.x - generalProjectile.location.x) <= 1 && Math.abs(targetBlock.y - generalProjectile.location.y) <= 1 && Math.abs(targetBlock.z - generalProjectile.location.z) <= 1)? 0:
        1;
        let dirLenght = cof/Math.sqrt(((projectileLocation.x - generalProjectile.location.x) ** 2) + ((projectileLocation.y - generalProjectile.location.y) ** 2) + ((projectileLocation.z - generalProjectile.location.z) ** 2));
        let direction = {x: (projectileLocation.x - generalProjectile.location.x) * dirLenght, y: (projectileLocation.y - generalProjectile.location.y) * dirLenght, z: (projectileLocation.z - generalProjectile.location.z) * dirLenght};
        generalProjectile.clearVelocity();
        generalProjectile.applyImpulse(direction);
        if(Math.abs(targetBlock.x - generalProjectile.location.x) <= 1 && Math.abs(targetBlock.y - generalProjectile.location.y) <= 1 && Math.abs(targetBlock.z - generalProjectile.location.z) <= 1 || !generalProjectile.isValid()){
            if(generalProjectile.isValid()){
                generalProjectile.getComponent('minecraft:rideable').ejectRiders();
                generalProjectile.remove();
            }
            if(projectile.isValid()) projectile.remove();
            system.clearRun(fly);
        }
    },2);
}
world.beforeEvents.worldInitialize.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("cosmos:grapple", {
        onUse(data){
            let visualProjectile = data.source.dimension.spawnEntity('cosmos:vgrapple', {x: data.source.location.x, y: data.source.location.y + 1, z: data.source.location.z});
            visualProjectile.getComponent('minecraft:projectile').shoot(data.source.getViewDirection());
            visualProjectile.setDynamicProperty('owner', data.source.id);
        },
    })
})
world.afterEvents.projectileHitBlock.subscribe((data) => {
    if(data.projectile.typeId != 'cosmos:vgrapple' && data.projectile.typeId != 'cosmos:gengrapple') return;
    if(data.projectile.typeId === 'cosmos:vgrapple') grappleProjectileFlying(data.projectile);
});