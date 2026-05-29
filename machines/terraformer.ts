import { MachineRegistry, gui } from "../ui_datagen";

export function register(reg: MachineRegistry) {
	const m = reg.add(gui("terraformer", "Terraformer", 237));
	
	m.hideCloseButton();
	m.closeButton(150, 4);

	// Background image
	m.drawImage("textures/gui/terraformer", 0, 0, 176, 237);
	
	// Fluid Tank: x=56, y=18, width=39, height=26.
	// We pass width=39, height=26. ui_datagen uses height for the visual tank size, passing Java dimensions directly.
	m.drawFluidTank(56, 18, "water", { name: "water_tank", width: 39, height: 26 });

	// Slot 0 (Water Bucket): x=25, y=19
	m.slot(25, 19, { name: "water_bucket" });
	
	// Slot 1 (Battery): x=25, y=39
	m.slot(25, 39, { name: "battery", ghost: "power" });
	
	// Energy Bar: x=45, y=48, width=54, height=7. ui_datagen uses drawEnergyBar at x,y
	m.drawEnergyBar(45, 48);

	// Slots 2,3,4,5 (Bonemeal): x=25, 43, 61, 79 and y=63
	m.slot(25, 63, { name: "bonemeal_0" });
	m.slot(43, 63, { name: "bonemeal_1" });
	m.slot(61, 63, { name: "bonemeal_2" });
	m.slot(79, 63, { name: "bonemeal_3" });

	// Slots 6,7,8,9 (Saplings): x=25, 43, 61, 79 and y=87
	m.slot(25, 87, { name: "sapling_0" });
	m.slot(43, 87, { name: "sapling_1" });
	m.slot(61, 87, { name: "sapling_2" });
	m.slot(79, 87, { name: "sapling_3" });

	// Slots 10,11,12,13 (Seeds): x=25, 43, 61, 79 and y=111
	m.slot(25, 111, { name: "seed_0" });
	m.slot(43, 111, { name: "seed_1" });
	m.slot(61, 111, { name: "seed_2" });
	m.slot(79, 111, { name: "seed_3" });

	// Buttons
	// Toggle Trees: x=98, y=85, width=72, height=20
	m.addButton(98, 85, { name: "toggle_trees", width: 72, height: 20 });
	
	// Toggle Grass: x=98, y=109, width=72, height=20
	m.addButton(98, 109, { name: "toggle_grass", width: 72, height: 20 });
	
	// Toggle Bubble: x=85, y=132, width=13, height=13
	m.addCheckbox(85, 132, { name: "toggle_bubble" });
}
