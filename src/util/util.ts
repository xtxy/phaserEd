import { Vector } from "matter";
import { Math as PhaserMath, Tilemaps } from "phaser";

export function getPathBase(name: string, withSfx?: boolean) {
    let index = name.lastIndexOf("/");
    if (index >= 0) {
        name = name.substring(index + 1);
    }

    if (withSfx) {
        return name;
    }

    index = name.lastIndexOf(".");
    if (index > 0) {
        name = name.substring(0, index);
    }

    return name;
}

export function minMax(a: number, b: number) {
    if (a <= b) {
        return { min: a, max: b };
    }

    return { min: b, max: a };
}

export function distanceSqr(x1: number, y1: number, x2: number, y2: number): number {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

export function isClick(x1: number, y1: number, x2: number, y2: number): boolean {
    return distanceSqr(x1, y1, x2, y2) <= 2;
}

export function alignTile(pos: number, tileSize: number): number {
    if (pos >= 0) {
        return Math.floor(pos / tileSize) * tileSize;
    } else {
        return Math.floor((pos + 1 - tileSize) / tileSize) * tileSize;
    }
}

export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

export async function loadJsonFile(name: string) {
    let ret = await goReadFile(name, false);
    if (ret.Error) {
        popupMsg(ret.Error);
        return null;
    }

    let data;
    try {
        data = JSON.parse(ret.Data);
    } catch (e) {
        console.error(e);
        return null;
    }

    return data;
}

export function getTileSetPosByIndex(tileSet: Tilemaps.Tileset, index: number): PhaserMath.Vector2 | null {
    if (!tileSet.containsTileIndex(index)) {
        return null;
    }

    let gid = index - tileSet.firstgid;
    let x = gid % tileSet.columns;
    let y = Math.floor(gid / tileSet.columns);

    return new PhaserMath.Vector2(x, y);
}

export function waitUntilNextFrame(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 16));
}