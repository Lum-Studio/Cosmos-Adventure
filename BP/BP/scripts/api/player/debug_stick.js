import { BlockStates, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

function swap(player, block, [state, value]) {
    block.setPermutation(block.permutation.withState(state, !value))
    debug(player, block, block.permutation)
}
function select(player, block, [state, value]) {
    const values = BlockStates.get(state).validValues
    const form = new ActionFormData()
    .title(state)
    values.forEach(option => {
        form.button((value == option ? '§2' : '§4') + option)
    })
    form.show(player).then((response) => {
        if (response.canceled) return
        block.setPermutation(block.permutation.withState(state, values[response.selection]))
    })
}

function debug(player, block, perm) {
    const states = perm.getAllStates()
    const options = Object.keys(states).map(state => [[state, states[state]], typeof states[state] == "boolean" ? swap : select] )
    if (!options.length) return
    const form = new ActionFormData()
    .title("Block States")
    options.forEach(option => {
        const state = option[0][0]
        const value = option[0][1]
        const boolean = typeof value == "boolean"
        form.button(boolean ? ((value ? '§2' : '§4') + state) : `${state} : ${value}`)
    })
    form.show(player).then((response) => {
        if (response.canceled) return
        options[response.selection][1](player, block, options[response.selection][0])
    })
}

world.beforeEvents.worldInitialize.subscribe(({itemComponentRegistry}) => {
    itemComponentRegistry.registerCustomComponent("cosmos:debug_stick", {
        onUseOn({block, source:player, usedOnBlockPermutation:perm}) {
            debug(player, block, perm)
        }
    })
})