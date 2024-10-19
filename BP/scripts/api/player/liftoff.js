import { world, system } from "@minecraft/server"
import { start_celestial_selector } from "./celestial_selector"

function start_countdown(rocket, player) {
    const title = player.onScreenDisplay
    rocket.setDynamicProperty('active', true)
    let countdown = 2 //20
    const counter = system.runInterval(()=> {
        if (countdown - 1) {
            countdown--
            title.setTitle('§c' + countdown, {fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 20})
        } else {
            world.sendMessage('Liftoff!')
            system.clearRun(counter)
            break_pad(rocket)
            rocket_fly(rocket)
        }
    }, 20)
}

function break_pad(rocket) {
    const {location:{x,y,z}, dimension} = rocket
    world.gameRules.doTileDrops = false
    dimension.runCommand(`fill ${x-1} ${y} ${z-1} ${x+1} ${y} ${z+1} air destroy`)
    world.gameRules.doTileDrops = true
} 

function dismount(player) {
    player.setDynamicProperty('in_the_rocket')
    player.onScreenDisplay.setTitle('')
    player.camera.clear()
}

function rocket_fly(rocket) {
    if (!rocket || !rocket.isValid()) return
    rocket.addEffect('levitation', 2000, {showParticles: false})
    let t = 0; let v
    const a = 30; const b = 10
    system.runInterval(() => { t++
        if (!rocket || !rocket.isValid()) return
        v = Math.ceil((a - 1) * (1 - Math.pow(Math.E, (-t/(20 * b)))))
        rocket.addEffect('levitation', 2000, {showParticles: false, amplifier: v})
    })
}

world.afterEvents.entityRemove.subscribe(({removedEntityId}) => {
    world.getPlayers().filter(player => player.getDynamicProperty('in_the_rocket') == removedEntityId)
    .forEach(player => dismount(player))
})

system.afterEvents.scriptEventReceive.subscribe(({id, sourceEntity:rocket, message}) => {
    if (id != "cosmos:rocket") return
    if (!["cosmos:rocket_tier_1", "cosmos:rocket_tier_2", "cosmos:rocket_tier_3"].includes(rocket?.typeId)) return
    const rider = rocket.getComponent('minecraft:rideable').getRiders()
    .find(rider => rider.typeId == "minecraft:player")
    if (message == "tick") {
        const active = rocket.getDynamicProperty('active')
        //camera shake
        if (rider && active) {
            rider.runCommand(`camerashake add @s 0.1 1`)
        }
        //set the camera and the player in the rocket      
        if (rider && !rider.getDynamicProperty('in_the_rocket')) {
            rider.camera.setCamera("minecraft:third_person_front")
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
            rocket.remove()
            if (current_rider) {
                start_celestial_selector(current_rider)
            }
        }
    }
    if (message == "ignite") {
        if (!rider || rider.typeId != "minecraft:player") return
        if (rocket.getDynamicProperty('active')) return
        const space_gear = JSON.parse(rider.getDynamicProperty("space_gear") ?? '{}')
        if (space_gear.parachute || rocket.getDynamicProperty('ready')) {
            start_countdown(rocket, rider)
        } else {
            rider.sendMessage("You do not have a parachute.")
            rider.sendMessage("Press jump again to start the countdown.")
            rocket.setDynamicProperty('ready', true)
        }
    }
})