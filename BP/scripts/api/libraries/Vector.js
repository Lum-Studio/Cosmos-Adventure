/*
 * Copyright Â© 2023 Free Term Of Use bc ConMaster2112
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software. You must include and keep this
 * copyright notice in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Rewritten and modified by "Remember M9"
 */
export function Vec3(x = 0, y = 0, z = 0) {
    const V3 = new.target ? this : { x, y, z };
    V3.x = Number(x); V3.y = Number(y); V3.z = Number(z);
    V3["__proto__"] = __proto__;
    return V3;
};

const magnitude = Vec3.magnitude = function magnitude(vec) {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
};
const normalize = Vec3.normalize = function normalize(vec) {
    const l = magnitude(vec), V3 = { x: vec.x / l, y: vec.y / l, z: vec.z / l };
    V3.__proto__ = __proto__;
    return V3;
};
const cross = Vec3.cross = function cross(a, b) {
    const V3 = { x: a.y * b.z - a.z * b.y, y: a.x * b.z - a.z * b.x, z: a.x * b.y - a.y * b.x };
    V3.__proto__ = __proto__;
    return V3;
}
const dot = Vec3.dot = function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
};
const angleBetween = Vec3.angleBetween = function angleBetween(a, b) {
    return Math.acos(dot(a, b) / (magnitude(a) * magnitude(b)));
};
const subtract = Vec3.subtract = function subtract(a, b) {
    const V3 = (typeof b == "number") ? { x: a.x - b, y: a.y - b, z: a.z - b } : { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    V3.__proto__ = __proto__;
    return V3;
};
const add = Vec3.add = function add(a, b) {
    const V3 = (typeof b == "number") ? { x: a.x + b, y: a.y + b, z: a.z + b } : { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    V3.__proto__ = __proto__;
    return V3;
};
const multiply = Vec3.multiply = function multiply(a, b) {
    const V3 = (typeof b == "number") ? { x: a.x * b, y: a.y * b, z: a.z * b } : { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
    V3.__proto__ = __proto__;
    return V3;
};
const floor = Vec3.floor = function floor(vec) {
    const V3 = { x: Math.floor(vec.x), y: Math.floor(vec.y), z: Math.floor(vec.z) };
    V3.__proto__ = __proto__;
    return V3;
};
const projection = Vec3.projection = function projection(a, b) { return multiply(b, dot(a, b) / ((b.x * b.x + b.y * b.y + b.z * b.z) ** 2)); }
const rejection = Vec3.rejection = function rejection(a, b) { return subtract(a, projection(a, b)); }
const reflect = Vec3.reflect = function reflect(v, n) { return subtract(v, multiply(n, 2 * dot(v, n))); }
const lerp = Vec3.lerp = function lerp(a, b, t) { return add(multiply(a, 1 - t), multiply(b, t)); }
const distance = Vec3.distance = function distance(a, b) { return magnitude(subtract(a, b)); }
const sort = Vec3.sort = function sort(vec1, vec2) {
    const [x1, x2] = vec1.x < vec2.x ? [vec1.x, vec2.x] : [vec2.x, vec1.x];
    const [y1, y2] = vec1.y < vec2.y ? [vec1.y, vec2.y] : [vec2.y, vec1.y];
    const [z1, z2] = vec1.z < vec2.z ? [vec1.z, vec2.z] : [vec2.z, vec1.z];
    const V3s = [{ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }];
    V3s[0].__proto__ = __proto__;
    V3s[1].__proto__ = __proto__;
    return V3s;
};

const __proto__ = Vec3.prototype = {
    distance(vec) { return distance(this, vec); },
    lerp(vec, t) { return lerp(this, vec, t); },
    projection(vec) { return projection(this, vec); },
    reflect(vec) { return reflect(this, vec); },
    rejection(vec) { return rejection(this, vec); },
    cross(vec) { return cross(this, vec); },
    dot(vec) { return dot(this, vec); },
    add(vec) { return add(this, vec); },
    subtract(vec) { return subtract(this, vec); },
    multiply(num) { return multiply(this, num); },
    floor() { return floor(this); },
    get length() { return magnitude(this); },
    get normalized() { return normalize(this); },
    x: 0,
    y: 0,
    z: 0,
    toString() { return `<${this.x}, ${this.y}, ${this.z}>`; }
};

Vec3.up = new Vec3(0, 1, 0);
Vec3.down = new Vec3(0, -1, 0);
Vec3.right = new Vec3(1, 0, 0);
Vec3.left = new Vec3(-1, 0, 0);
Vec3.forward = new Vec3(0, 0, 1);
Vec3.backward = new Vec3(0, 0, -1);
Vec3.zero = new Vec3(0, 0, 0);
Vec3.one = new Vec3(1, 1, 1);

Object.defineProperties(Vec3, {
    up: { get() { const V3 = { x: 0, y: 1, z: 0 }; V3.__proto__ = __proto__; return V3 } },
    down: { get() { const V3 = { x: 0, y: -1, z: 0 }; V3.__proto__ = __proto__; return V3 } },
    right: { get() { const V3 = { x: 1, y: 0, z: 0 }; V3.__proto__ = __proto__; return V3 } },
    left: { get() { const V3 = { x: -1, y: 0, z: 0 }; V3.__proto__ = __proto__; return V3 } },
    forward: { get() { const V3 = { x: 0, y: 0, z: 1 }; V3.__proto__ = __proto__; return V3 } },
    backward: { get() { const V3 = { x: 0, y: 0, z: -1 }; V3.__proto__ = __proto__; return V3 } },
    zero: { get() { const V3 = { x: 0, y: 0, z: 0 }; V3.__proto__ = __proto__; return V3 } },
    one: { get() { const V3 = { x: 1, y: 1, z: 1 }; V3.__proto__ = __proto__; return V3 } },
});

for (const key of Object.keys(Vec3)) Object.defineProperty(Vec3, key, { enumerable: false });
