
/**
* Return number of cardinal direction
* @param {string} direction
* @returns {number}
*/
export function cardinalToDirectionInt(direction) {
    switch (direction) {
        case "up":
            return 0;
        case "down":
            return 1;
        case "south":
            return 2;
        case "north":
            return 3;
        case "east":
            return 4;
        default: 
            return 5;
    }
 }