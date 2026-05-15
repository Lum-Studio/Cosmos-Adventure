import { ItemStack } from "@minecraft/server"

export const machine_buttons = new Map()

export function setup_ui_button(entity, slot, text) {
    const container = entity.getComponent('minecraft:inventory').container
    const button = new ItemStack('cosmos:ui_button')
    button.setDynamicProperty("machine_id", entity.id)
    button.setDynamicProperty('slot', slot)
    button.nameTag = text
    container.setItem(slot, button)
}