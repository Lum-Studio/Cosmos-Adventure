import { MachineRegistry, gui } from "../ui_datagen";

export function register(reg: MachineRegistry) {
	const m = reg.add(gui("geothermal_generator", "Geothermal Generator", 201));

	// Title
	m.drawTitle();

	// Battery Slot (index 0)
	m.slot(152, 83, { name: "battery_slot", ghost: "power" });

	m.addButton(52, 81, { name: "enable_button" });

	// Energy Bar
	// at x=97, y=25, width=54, height=7
	m.drawEnergyBar(97, 25);

	// Generation indicator (bubbling/liquid)
	// at x=33, y=21, width=46, height=16
	m.drawFluidTank(33, 21, "lava", { height: 16, name: "lava_tank" });


}
