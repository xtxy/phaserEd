export namespace Orca {
    export namespace Math {
        export const rvo_epsilon = 0.00001;

        export function sqr(num: number): number {
            return num * num;
        }

        export function absSq(x: number, y: number): number {
            return x * x + y * y;
        }

        export function det(x1: number, y1: number, x2: number, y2: number): number {
            return x1 * y2 - x2 * y1;
        }
    }
}