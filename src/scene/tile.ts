import { TileMapBrushTile } from "../model/tileMap";
import { Math as PhaserMath } from "phaser";

export function centerTiles(tiles: TileMapBrushTile[], tileWidth: number, tileHeight: number) {
    let center = { minX: tiles[0].pos.x, minY: tiles[0].pos.y, maxX: tiles[0].pos.x, maxY: tiles[0].pos.y };

    for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        if (tile.pos.x < center.minX) {
            center.minX = tile.pos.x;
        } else if (tile.pos.x > center.maxX) {
            center.maxX = tile.pos.x;
        }
        if (tile.pos.y < center.minY) {
            center.minY = tile.pos.y;
        } else if (tile.pos.y > center.maxY) {
            center.maxY = tile.pos.y;
        }
    }

    let delta = new PhaserMath.Vector2(center.maxX + 1 - center.minX, center.maxY + 1 - center.minY);
    let size = new PhaserMath.Vector2(delta.x * tileWidth, delta.y * tileHeight);

    let centerX = Math.floor((center.maxX + center.minX) / 2);
    let centerY = Math.floor((center.maxY + center.minY) / 2);

    let relative: PhaserMath.Vector2[] = [];
    let relativePos: PhaserMath.Vector2[] = [];

    for (let i = 0; i < tiles.length; ++i) {
        let pos = tiles[i].pos;
        let x = pos.x - centerX;
        let y = pos.y - centerY;
        relative.push(new PhaserMath.Vector2(x, y));
        relativePos.push(new PhaserMath.Vector2(x * tileWidth, y * tileHeight));
    }

    return {
        delta: delta, size: size,
        relative: relative, relativePos: relativePos,
    }
}