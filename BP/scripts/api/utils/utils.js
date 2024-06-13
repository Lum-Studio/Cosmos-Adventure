import machines from "../../core/machines/AllMachineBlocks"

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