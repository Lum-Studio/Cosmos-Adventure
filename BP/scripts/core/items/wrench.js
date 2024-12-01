import {world, system} from "@minecraft/server";
import {detach_wires, attachWires, attach_to_wires} from "../blocks/aluminum_wire"
import { MachineInstances } from "../machines/MachineInstances"

const directions = ["north", "east", "south", "west"]

function rotate(block, machine) {
  const direction = machine.getState("minecraft:cardinal_direction")
  const turn_to = directions[directions.indexOf(direction) + 1] ?? "north"
  const entity = block.dimension.getEntities({
		families: ["power"],
		location: block.center(),
		maxDistance: 0.5
	})[0]
	block.setPermutation(machine.withState("minecraft:cardinal_direction", turn_to))
	entity?.setProperty("cosmos:direction", turn_to) //remove this once we get rid of the cosmos:direction property
	system.runTimeout(()=>{
    attach_to_wires(block)
    entity ? attachWires(entity) : null
  }, 1)
}

function remove(block) {
  detach_wires(block)
  const {dimension, location} = block
  const coords = `${location.x} ${location.y} ${location.z}`
  dimension.runCommand(`fill ${coords} ${coords} air destroy`)
  MachineInstances.get(dimension, location)?.destroy()
}

world.beforeEvents.worldInitialize.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("cosmos:wrench", {
        onUseOn({block, source:player, usedOnBlockPermutation:machine}){
          if (!block.hasTag("machine")) return
          if (player.isSneaking) remove(block)
          else rotate(block, machine)
        }
    })
})