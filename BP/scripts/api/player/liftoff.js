import { world, system } from "@minecraft/server"
import { start_celestial_selector } from "./celestial_selector"

function lander_rotation(player, lander){
    let final_rotation_x = lander.getProperty("cosmos:rotation_x");
    let final_rotation_y = lander.getProperty("cosmos:rotation_y");
    
    let input = player.inputInfo.getMovementVector();
    input = {x: Math.round(input.x), y: Math.round(input.y)}
    final_rotation_x = Math.min(Math.max(final_rotation_x + (input.y * 2), -45), 45);
    final_rotation_y = final_rotation_y + (input.x * 2);

    final_rotation_y = (final_rotation_y > 360)? 2:
    (final_rotation_y < 0)? 358:
    final_rotation_y;
    return [final_rotation_x, final_rotation_y]
}
export function moon_lander(player, load = true){
    let speed = 0;
    player.inputPermissions.setPermissionCategory(2, false);
    player.inputPermissions.setPermissionCategory(6, false);
    player.setProperty("cosmos:rotation_x", 90);
    
    let lander = player.dimension.spawnEntity("cosmos:lander", {x: player.location.x, y: 1, z: player.location.z});
    lander.triggerEvent("cosmos:lander_gravity_disable");
    lander.teleport(player.location);
    lander.setDynamicProperty("fuel_level", JSON.parse(player.getDynamicProperty('dimension'))[1]);
    lander.getComponent("minecraft:rideable").addRider(player);
    player.camera.setCamera("minecraft:follow_orbit", { radius: 20 });
    player.setDynamicProperty("dimension", undefined);
    //lander.triggerEvent("cosmos:lander_gravity_enable");
    let is_load = load;
    let camera = player.getRotation();
    let lander_flight = system.runInterval(() => {
        if(is_load){
            let new_camera = player.getRotation();
            if(new_camera.x != camera.x || new_camera.y != camera.y) is_load = false
            return;
        }
        if(!player || !player.isValid()){
            system.clearRun(lander_flight);
            return;
        }
        if(!lander || !lander.isValid()){
            dismount(player);
            system.clearRun(lander_flight);
            return;
        }
        if(player.inputInfo.getButtonState("Jump") == "Pressed"){
            speed = Math.min(speed + 0.03, lander.location.y < 115 ? -0.15 : -1.0);
        }else{
            speed = Math.min(speed - 0.022, -1.0);
        }
        speed -= 0.008;

        let translatedSpeed = {"rawtext": [
            {"translate": "gui.lander.velocity"},
            {"text": ": "},
            {"text": `${(Math.round(speed * 1000)/100)}`},
            {"text": " "},
            {"translate": "gui.lander.velocityu"}
        ]}
        player.onScreenDisplay.setTitle(" ", {fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 2, subtitle: translatedSpeed})

        let rotation = lander_rotation(player, lander)
        lander.setProperty("cosmos:rotation_x", rotation[0])
        lander.setProperty("cosmos:rotation_y", rotation[1])

        let motY = Math.sin(rotation[0]/57.2957795147);
        let motX = Math.cos(rotation[1]/57.2957795147) * motY;
        let motZ = Math.sin(rotation[1]/57.2957795147) * motY;
        let speedX = motX / 2.0;
        let speedZ = motZ / 2.0;

        lander.clearVelocity();
        lander.applyImpulse({x: speedX, y: speed, z: speedZ})
        if(lander.location.y < 500 && lander.getVelocity().y === 0){
            if(Math.abs(speed) > 2){
                dismount(player);

                lander.setProperty("cosmos:rotation_x", 0)

                lander.dimension.createExplosion(lander.location, 10, {causesFire: false, breaksBlocks: true});
                lander.remove();
                system.clearRun(lander_flight);
            }else{
                lander.setProperty("cosmos:rotation_x", 0)
    
                player.inputPermissions.setPermissionCategory(2, true);
                lander.triggerEvent("cosmos:lander_gravity_enable")
                system.clearRun(lander_flight);
            }
        }
    });
}
world.afterEvents.playerDimensionChange.subscribe((data) => {
    if(!data.player.getDynamicProperty('dimension')) return;
    if(data.fromDimension.id != "minecraft:overworld") return;
    if(JSON.parse(data.player.getDynamicProperty('dimension'))[0] == 'Moon'){
        moon_lander(data.player);
    }
});

function start_countdown(rocket, player) {
    rocket.setDynamicProperty('active', true)
    player.inputPermissions.setPermissionCategory(2, false)
    let countdown = 20
    const counter = system.runInterval(()=> {
        if (!rocket || !rocket.isValid()) {
            system.clearRun(counter)
        }
        if (countdown - 1) {
            countdown--
            player.onScreenDisplay.setTitle('§c' + countdown, {fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 20})
        } else {
            world.sendMessage('Liftoff!')
            system.clearRun(counter)
            rocket_flight(rocket)
            break_pad(rocket)
        }
    }, 20)
}

function break_pad(rocket) {
    if (!rocket || !rocket.isValid()) return
    const {location:{x,y,z}, dimension} = rocket
    world.gameRules.doTileDrops = false
    dimension.runCommand(`fill ${x-1} ${y} ${z-1} ${x+1} ${y} ${z+1} air destroy`)
    world.gameRules.doTileDrops = true
} 

function dismount(player) {
    player.setProperty("cosmos:is_sitting", 0);
    player.setProperty("cosmos:rotation_x", 90);
    //player.setProperty("cosmos:rotation_y", 180);
    player.setDynamicProperty('in_the_rocket')
    player.onScreenDisplay.setTitle('')
    player.camera.clear()
    player.inputPermissions.setPermissionCategory(2, true)
    player.inputPermissions.setPermissionCategory(6, true)
}
function rocket_rotation(player, rocket){
   let x = player.inputInfo.getMovementVector().x;
   let y = player.inputInfo.getMovementVector().y;
   x = Math.round(x)
   y = Math.round(y)
   let rotationX = (x == 0 && y == 0)?
   rocket.getProperty("cosmos:rotation_x"):
   (x == 0 && y == 1)? 
   rocket.getProperty("cosmos:rotation_x") - 0.7:
   (x == 0 && y == -1)? 
   rocket.getProperty("cosmos:rotation_x") + 0.7: 
   rocket.getProperty("cosmos:rotation_x");
   
   let rotationY = (x == 0 && y == 0)?
   rocket.getRotation().y:
   (x == 1 && y == 0)? 
   rocket.getRotation().y  + 1:
   (x == -1 && y == 0)? 
   rocket.getRotation().y - 1: 
   rocket.getRotation().y;
   rotationX = (rotationX > 180)? 180:
   (rotationX < 0)? 0:
   rotationX;
   return [rotationX, rotationY]
}

function rocket_flight(rocket) {
    if (!rocket || !rocket.isValid()) return
    rocket.addEffect('levitation', 2000, {showParticles: false})
    let t = 0; let v
    const a = 30; const b = 10
    let flight = system.runInterval(() => {
        if(!rocket || !rocket.isValid() || rocket.getComponent("minecraft:rideable").getRiders().length === 0){
            system.clearRun(flight);
            return;
        }
        let player = rocket?.getComponent("minecraft:rideable").getRiders()[0];
        if(player.getDynamicProperty("in_celestial_selector")) return;
        t++;
        if (t == 40) world.sendMessage('§7Do not save & quit or disconnect while flying the rocket or in the celestial selector.')
        if (!rocket || !rocket.isValid()) return
        if (v >= 10) rocket.setDynamicProperty('rocket_launched', true)
        v = Math.floor((a) * (1 - Math.pow(Math.E, (-t/(20 * b)))))
        rocket.addEffect('levitation', 2000, {showParticles: false, amplifier: v})
        let rotation = rocket_rotation(player, rocket)
        let fuel = rocket.getDynamicProperty('fuel_level')
        fuel = (fuel)? fuel:
        0;
        rocket.setRotation({x: rocket.getRotation().x, y: rotation[1]});
        rocket.setProperty("cosmos:rotation_x", rotation[0]);
        player.setProperty("cosmos:rotation_x", rotation[0]);
        rocket.setDynamicProperty("fuel_level", Math.max(0, fuel - 1))
    })
}

world.afterEvents.entityRemove.subscribe(({removedEntityId}) => {
    world.getPlayers().filter(player => player.getDynamicProperty('in_the_rocket') == removedEntityId)
    .forEach(player => dismount(player))
})

system.afterEvents.scriptEventReceive.subscribe(({id, sourceEntity:rocket, message}) => {
    if (id != "cosmos:rocket" && id != "cosmos:lander") return
    if (!["cosmos:rocket_tier_1", "cosmos:rocket_tier_2", "cosmos:rocket_tier_3", "cosmos:lander"].includes(rocket?.typeId)) return
    const rider = rocket.getComponent('minecraft:rideable').getRiders()
    .find(rider => rider.typeId == "minecraft:player")
    if (message == "tick") {
        if(id == "cosmos:lander"){
            system.runTimeout(() => {
                if (!rocket || !rocket.isValid() || !rider) return
                const ride_id = rider.getComponent('minecraft:riding')?.entityRidingOn?.id
                if (ride_id != rocket.id) {
                    dismount(rider)
                } 
            }, 20)
            return;
        }
        const active = rocket.getDynamicProperty('active')
        let fuel = (rocket.getDynamicProperty("fuel_level"))? rocket.getDynamicProperty("fuel_level"):
        0;
        //disable jumping
        if(rider){
            rider.inputPermissions.setPermissionCategory(6, false)
            rider.setProperty("cosmos:is_sitting", 1);
        }
        //camera shake
        if (rider && active) {
            rider.runCommand(`camerashake add @s 0.1 1`)
        }
        //ignite the engine when the player jumps
        if (rider?.inputInfo.getButtonState("Jump") == "Pressed") {
            if (rocket.getDynamicProperty('active')) return
            const space_gear = JSON.parse(rider.getDynamicProperty("space_gear") ?? '{}')
            if (fuel > 0 && (space_gear.parachute || rocket.getDynamicProperty('ready'))) {
                start_countdown(rocket, rider)
            }else if(fuel === 0){
                rider.sendMessage("I'll need to load in some rocket fuel first!");
            }else {
                rider.sendMessage("You do not have a parachute.")
                rider.sendMessage("Press jump again to start the countdown.")
                rocket.setDynamicProperty('ready', true)
            }
        }
        //set the camera and the player in the rocket      
        if (rider && !rider.getDynamicProperty('in_the_rocket')) {
            rider.camera.setCamera("minecraft:follow_orbit", { radius: 20 })
            rider.setDynamicProperty('in_the_rocket', rocket.id)
            //display the countdown timer
            if (!active) rider.onScreenDisplay.setTitle('§c20', {fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 20000})
        }
        //fix the camera and remove the countdown if the player leaves 
        system.runTimeout(() => {
            if (!rocket || !rocket.isValid() || !rider) return
            const ride_id = rider.getComponent('minecraft:riding')?.entityRidingOn?.id
            if (ride_id != rocket.id) {
                rocket.setDynamicProperty('ready')
                dismount(rider)
            } 
        }, 20)
        //explde when the rocket stops after laucnching
        if (rocket.getDynamicProperty("rocket_launched") && rocket.getVelocity().y == 0) {
            rocket.dimension.createExplosion(rocket.location, 10, {causesFire: true, breaksBlocks: true})
            rocket.remove()
        }
        //start the celestial selector when the rocket reaches space
        if (rocket && rocket.isValid() && active && rocket.location.y > 1200) {
            const current_rider = rocket.getComponent('minecraft:rideable').getRiders()
            .find(rider => rider.typeId == "minecraft:player")
            if (current_rider && !rocket.getDynamicProperty("freezed")){
                rocket.setDynamicProperty("freezed", true)
                start_celestial_selector(current_rider)
            }
        }
    }
})
