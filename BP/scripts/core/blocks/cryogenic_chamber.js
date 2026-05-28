import { world, system, BlockPermutation, LinearSpline } from "@minecraft/server"


export const cryogenic_chamber_component = {
    onPlayerInteract({player, block, dimension}){
        let states = block.permutation.getAllStates();
        if(states["cosmos:is_occupied"]) return;

        let {x, y, z} = block.location;
        let pos = [ {x: x, y: y, z: z}, {x: x, y: y - 1, z: z}, {x: x, y: y - 2, z: z}
        ][states["cosmos:chamber"]];

        let time = player.getDynamicProperty("chamber_time");

        if(!time || system.currentTick > time){
            
            /*it works but it is so choppy
            let degree = 90;
            let cam = 180;
            let cam_cycle = system.runInterval(() => {
                degree += 5;
                console.warn(degree)
                cam += 5;
                player.camera.setCamera("minecraft:free", 
                    {location: {x: pos.x + 0.5 + Math.cos(degree/57.2957795147) * 5, y: pos.y + 2, z: pos.z + 0.5 + Math.sin(degree/57.2957795147) * 5}, rotation: {x: 0, y: cam}}
                    );
                if(degree >= 360){
                    player.camera.clear();
                    system.clearRun(cam_cycle)
                }
            });*/

            let added_time = 0;
            let planet = player.getPlanet(); 
            if(planet){
                added_time = planet.time.day;
            }else added_time = 12000;

            player.teleport({x: pos.x + 0.5, y: pos.y + 0.75, z: pos.z + 0.5});

            world.setAbsoluteTime(world.getAbsoluteTime() + added_time);
            player.setDynamicProperty("chamber_time", system.currentTick + 6000);
        }else{
            world.sendMessage(`${Math.floor((time - system.currentTick)/20)}`);
        }
    },

    beforeOnPlayerPlace(event){
        if(!event.block.above().isAir || !event.block.above(2).isAir) event.cancel = true;
        else system.run(() => {
                event.block.above().setPermutation(BlockPermutation.resolve("cosmos:cryogenic_chamber", {"cosmos:chamber": 1}));
                event.block.above(2).setPermutation(BlockPermutation.resolve("cosmos:cryogenic_chamber", {"cosmos:chamber": 2}));
            });
    },
    onPlayerBreak({brokenBlockPermutation: perm, block}) {
        let {x, y, z} = block.location;
        let positions = [[{x: x, y: y + 1, z: z}, {x: x, y: y + 2, z: z}], 
        [{x: x, y: y - 1, z: z}, {x: x, y: y + 1, z: z}],
        [{x: x, y: y - 1, z: z}, {x: x, y: y - 2, z: z}]
        ][perm.getState("cosmos:chamber")];

        positions.forEach((vector) => {
            block.dimension.getBlock(vector).setPermutation(BlockPermutation.resolve("air"))
        });
    },
}