import machines from "../core/machines/AllMachineBlocks"

function get_data(machine) { return machines[machine.typeId.replace('cosmos:machine:', '')] }
function str(object) { return JSON.stringify(object) }
function compare_lists(list1, list2) {
	for (let i = 0; i < list1.length; i++) {
		if (list1[i] != list2[i]) return false
	} return true
}
export {
    get_data,
    str,
    compare_lists
}
export const pickaxes = new Set([
	"minecraft:wooden_pickaxe",
	"minecraft:stone_pickaxe",
	"minecraft:iron_pickaxe",
	"minecraft:golden_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
])
