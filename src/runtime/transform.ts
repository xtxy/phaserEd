export namespace Transform {
    export type Mat3 = [
        number, number, number,
        number, number, number,
        number, number, number,
    ];

    export type Vec3 = [number, number, number];

    export function rotate2D(angle: number): Mat3 {
        let de = angle * Math.PI / 180;
        let s = Math.sin(de);
        let c = Math.cos(de);

        return [
            c, s, 0,
            -s, c, 0,
            0, 0, 1,
        ];
    }

    export function scale2D(x: number, y: number): Mat3 {
        return [
            x, 0, 0,
            0, y, 0,
            0, 0, 1,
        ];
    }

    export function translate2D(x: number, y: number): Mat3 {
        return [
            1, 0, 0,
            0, 1, 0,
            x, y, 1,
        ];
    }

    export function maxtrixCopy(mat: Mat3): Mat3 {
        return [
            mat[0], mat[1], mat[2],
            mat[3], mat[4], mat[5],
            mat[6], mat[7], mat[8],
        ]
    }

    export function matrixMul(a: Mat3, b: Mat3, result: Mat3 | null): Mat3 {
        let r0 = a[0] * b[0] + a[3] * b[1] + a[6] * b[2];
        let r1 = a[1] * b[0] + a[4] * b[1] + a[7] * b[2];
        let r2 = a[2] * b[0] + a[5] * b[1] + a[8] * b[2];
        let r3 = a[0] * b[3] + a[3] * b[4] + a[6] * b[5];
        let r4 = a[1] * b[3] + a[4] * b[4] + a[7] * b[5];
        let r5 = a[2] * b[3] + a[5] * b[4] + a[8] * b[5];
        let r6 = a[0] * b[6] + a[3] * b[7] + a[6] * b[8];
        let r7 = a[1] * b[6] + a[4] * b[7] + a[7] * b[8];
        let r8 = a[2] * b[6] + a[5] * b[7] + a[8] * b[8];

        if (!result) {
            return [
                r0, r1, r2,
                r3, r4, r5,
                r6, r7, r8,
            ];
        }

        result[0] = r0;
        result[1] = r1;
        result[2] = r2;
        result[3] = r3;
        result[4] = r4;
        result[5] = r5;
        result[6] = r6;
        result[7] = r7;
        result[8] = r8;

        return result;
    }

    export function matrixMulVec(mat: Mat3, vec: Vec3, target: Vec3 | null): Vec3 {
        let r0 = mat[0] * vec[0] + mat[3] * vec[1] + mat[6] * vec[2];
        let r1 = mat[1] * vec[0] + mat[4] * vec[1] + mat[7] * vec[2];
        let r2 = mat[2] * vec[0] + mat[5] * vec[1] + mat[8] * vec[2];

        if (!target) {
            return [r0, r1, r2];
        }

        target[0] = r0;
        target[1] = r1;
        target[2] = r2;

        return target;
    }

    export function matrixDeterminant(mat: Mat3): number {
        return mat[0] * mat[4] * mat[8] +
            mat[3] * mat[7] * mat[2] +
            mat[6] * mat[1] * mat[5] -
            mat[6] * mat[4] * mat[2] -
            mat[3] * mat[1] * mat[8] -
            mat[0] * mat[7] * mat[5];
    }

    export function matrixInverse(mat: Mat3): Mat3 {
        let det = matrixDeterminant(mat);
        if (det > -0.00000001 && det < 0.00000001) {
            return [0, 0, 0, 0, 0, 0, 0, 0, 0];
        }

        return [
            (mat[4] * mat[8] - mat[5] * mat[7]) / det,
            (mat[2] * mat[7] - mat[1] * mat[8]) / det,
            (mat[1] * mat[5] - mat[2] * mat[4]) / det,
            (mat[5] * mat[6] - mat[3] * mat[8]) / det,
            (mat[0] * mat[8] - mat[2] * mat[6]) / det,
            (mat[2] * mat[3] - mat[0] * mat[5]) / det,
            (mat[3] * mat[7] - mat[4] * mat[6]) / det,
            (mat[1] * mat[6] - mat[0] * mat[7]) / det,
            (mat[0] * mat[4] - mat[1] * mat[3]) / det,
        ];
    }
}