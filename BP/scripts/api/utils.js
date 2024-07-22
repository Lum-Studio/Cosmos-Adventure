import machines from "../core/machines/AllMachineBlocks"

export function get_data(machine) {
	return machines[machine.typeId.replace('cosmos:machine:', '')]
}

export function str(object) { return JSON.stringify(object) }

export function compare_lists(list1, list2) {
	for (let i = 0; i < list1.length; i++) {
		if (list1[i] != list2[i]) return false
	} return true
}
export function get_vars(item, index, def = 0) {
    return item ? + item.getLore()[index] : def
}

export const pickaxes = new Set([
	"minecraft:wooden_pickaxe",
	"minecraft:stone_pickaxe",
	"minecraft:iron_pickaxe",
	"minecraft:golden_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])
