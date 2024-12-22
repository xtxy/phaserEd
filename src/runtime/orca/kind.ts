
import { Orca as OrcaMath } from "./math";

export namespace Orca {
    export class Vector2 {
        x: number
        y: number

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        copy(ret?: Vector2) {
            if (!ret) {
                ret = new Vector2(this.x, this.y);
            } else {
                ret.x = this.x;
                ret.y = this.y;
            }

            return ret;
        }

        dot(v2: Vector2): number {
            return this.x * v2.x + this.y * v2.y;
        }

        det(v2: Vector2): number {
            return this.x * v2.y - this.y * v2.x;
        }

        sub(v2: Vector2, ret?: Vector2): Vector2 {
            if (!ret) {
                ret = new Vector2(this.x - v2.x, this.y - v2.y);
            } else {
                ret.x = this.x - v2.x;
                ret.y = this.y - v2.y;
            }

            return ret;
        }

        add(v2: Vector2, ret?: Vector2): Vector2 {
            if (!ret) {
                ret = new Vector2(this.x + v2.x, this.y + v2.y);
            } else {
                ret.x = this.x + v2.x;
                ret.y = this.y + v2.y;
            }

            return ret;
        }

        len(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        normalize(ret?: Vector2): Vector2 {
            let length = this.len();
            let x: number;
            let y: number;
            if (length < 0.00001) {
                x = 0;
                y = 0;
            } else {
                x = this.x / length;
                y = this.y / length;
            }
                
            if (!ret) {
                ret = new Vector2(x, y);
            } else {
                ret.x = x;
                ret.y = y;
            }

            return ret;
        }

        mul(num: number, ret?: Vector2): Vector2 {
            if (!ret) {
                ret = new Vector2(this.x * num, this.y * num);
            } else {
                ret.x = this.x * num;
                ret.y = this.y * num;
            }

            return ret;
        }
    }

    export class Line {
        dir: Vector2
        point: Vector2

        constructor() {
            this.dir = new Vector2(0, 0);
            this.point = new Vector2(0, 0);
        }
    }

    export class Obstacle {
        id: number
        convex: boolean
        next: Obstacle
        prev: Obstacle
        dir: Vector2
        point: Vector2
    }

    export function leftOf(a: Vector2, b: Vector2, c: Vector2): number {
        return OrcaMath.Math.det(a.x - c.x, a.y - c.y, b.x - a.x, b.y - a.y);
    }
}
