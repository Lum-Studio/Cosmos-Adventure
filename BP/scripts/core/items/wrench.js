import {world, system} from "@minecraft/server";
import {detach_wires, attach_to_wires} from "../blocks/aluminum_wire"
import {machine_entities} from "../machines/Machine"

const directions = ["north", "east", "south", "west"]

function rotate(block, perm) {
  const direction = perm.getState("minecraft:cardinal_direction")
  const turn_to = directions[directions.indexOf(direction) + 1] ?? "north"
	block.setPermutation(perm.withState("minecraft:cardinal_direction", turn_to))
	system.runTimeout(()=>{
    detach_wires(block)
    attach_to_wires(block)
  }, 1)
}

function remove(block) {
  detach_wires(block)
  const {dimension, location} = block
  const coords = `${location.x} ${location.y} ${location.z}`
  dimension.runCommand(`fill ${coords} ${coords} air destroy`)
  const machineEntity = dimension.getEntitiesAtBlockLocation(block.location).find((entity) => entity?.getDynamicProperty("block_location") == block.location);
  if(machineEntity) machine_entities.delete(machineEntity.id)

}

world.beforeEvents.worldInitialize.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("cosmos:wrench", {
        onUseOn({block, source:player, usedOnBlockPermutation:perm}){
          if (!block.hasTag("machine")) return
          if (player.isSneaking) remove(block)
          else rotate(block, perm)
        }
    })
})
