import { Planet } from "./GalacticraftPlanets";
import { system } from "@minecraft/server";
import { Gravity } from "./gravity";

export const planetConfigs = [
    {
        id: 'mars',
        range: { start: { x: -100000, z: 50000 }, end: { x: -50000, z: 100000 } },
        gravity: 3.7
    },
    {
        id: 'venus',
        range: { start: { x: 50000, z: -100000 }, end: { x: 100000, z: -50000 } },
        gravity: 8.87
    },
    {
        id: 'moon',
        range: { start: { x: 50000, z: 50000 }, end: { x:100000, z: 100000 } },
        gravity: 1.62
    },
    {
        id: 'asteroids',
        range: { start: { x: -100000, z: -100000 }, end: { x: -50000, z: -50000 } },
        gravity: 0.05
    }
];

// Register each planet from the configuration
planetConfigs.forEach(planet => {
    Planet.register(planet.id, {
        range: planet.range,
        gravity: planet.gravity
    });    
});

// Adding Gravity
system.runTimeout(() => {
    for (let planet of Planet.getAll()) {
        if (planet.type == 'venus') continue;
        planet.events.onJoin('addGravity', ((event, player) => {
            new Gravity(player).setTemp(planet.gravity)
            // console.warn("joined "+ planet.type);
            
        }))

        planet.events.onLeave('removeGravity', ((event, player) => {
            new Gravity(player).setTemp(9.8)
            // console.warn("left "+ planet.type);
        }))
    }
})