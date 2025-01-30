import { Planet } from "./GalacticraftPlanets";


Planet.register('mars', {
    range: { start: { x: 50000, z: 50000 }, end: { x: 100000, z: 100000 } },
    gravity: 3.7
});

Planet.register('venus', {
    range: { start: { x: 50000, z: -100000 }, end: { x: 100000, z: -50000 } },
    gravity: 8.87
});

Planet.register('moon', {
    range: { start: { x: -100000, z: 50000 }, end: { x: -50000, z: 100000 } },
    gravity: 1.62
});

Planet.register('asteroids', {
    range: { start: { x: -100000, z: -100000 }, end: { x: -50000, z: -50000 } },
    gravity: 0.5
});

