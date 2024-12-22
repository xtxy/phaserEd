import { GameObjects, Geom, Math as PhaserMath, Scene } from "phaser";
import { minMax } from "../util/util";
import { TileMapBrushTile } from "../model/tileMap";

export class DragRect {
    private scene: Scene
    private graphics: GameObjects.Graphics
    private rect: Geom.Rectangle

    constructor(scene: Scene, color: number, alpha: number, depth: number) {
        this.scene = scene;
        this.graphics = scene.add.graphics({
            lineStyle: {
                width: 1, color: color,
            },
            fillStyle: {
                color: color, alpha: alpha,
            },
        });

        this.graphics.depth = depth;
        this.rect = new Geom.Rectangle();
    }

    draw(x1: number, y1: number, x2: number, y2: number) {
        this.graphics.clear();

        let camera = this.scene.cameras.main;
        let pos1 = camera.getWorldPoint(x1, y1);
        let pos2 = camera.getWorldPoint(x2, y2);

        Geom.Rectangle.FromPoints([
            [pos1.x, pos1.y],
            [pos2.x, pos2.y],
        ], this.rect);

        this.graphics.fillRectShape(this.rect);
    }

    clear() {
        this.graphics.clear();
    }
}

export type LimitRect = {
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
};

export class SelectRects {
    private scene: Scene
    private kind: string
    private depth: number
    private fillColor: number
    private strokeColor: number
    private fillAlpha: number
    private indexLimit?: LimitRect

    constructor(scene: Scene, kind: string, depth: number, fillColor: number, strokeColor: number, fillAlpha: number) {
        this.scene = scene;
        this.kind = kind;
        this.depth = depth;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.fillAlpha = fillAlpha;
    }

    clear() {
        let children = this.scene.children.getChildren();
        for (let i = 0; i < children.length; i++) {
            let obj = children[i];
            if (obj.getData("kind") == this.kind) {
                obj.destroy();
                i--;
            }
        }
    }

    get(): TileMapBrushTile[] {
        let arr: TileMapBrushTile[] = [];
        let children = this.scene.children.getChildren();

        for (let i = 0; i < children.length; i++) {
            let obj = children[i];
            if (obj.getData("kind") != this.kind) {
                continue;
            }

            let x = obj.getData("x");
            let y = obj.getData("y");
            let id = obj.getData("id");

            let tile = new TileMapBrushTile(id, x, y);
            arr.push(tile);
        }

        arr.sort((a, b) => {
            return a.id - b.id;
        });

        return arr;
    }

    clearLimit() {
        this.indexLimit = undefined;
    }

    setLimit(minX: number, minY: number, maxX: number, maxY: number) {
        this.indexLimit = {
            minX: minX, minY: minY, maxX: maxX, maxY: maxY,
        };
    }

    add(x1: number, y1: number, x2: number, y2: number, tileWidth: number, tileHeight: number, imageWidth: number,
        out?: LimitRect): LimitRect {
        let camera = this.scene.cameras.main;
        let pos1 = camera.getWorldPoint(x1, y1);
        let pos2 = camera.getWorldPoint(x2, y2);

        this.pointer2Index(pos1, tileWidth, tileHeight, pos1);
        this.pointer2Index(pos2, tileWidth, tileHeight, pos2);

        let xInfo = minMax(pos1.x, pos2.x);
        let yInfo = minMax(pos1.y, pos2.y);

        for (let x = xInfo.min; x <= xInfo.max; ++x) {
            if (this.indexLimit && (x < this.indexLimit.minX || x > this.indexLimit.maxX)) {
                continue;
            }

            for (let y = yInfo.min; y <= yInfo.max; y++) {
                if (this.indexLimit && (y < this.indexLimit.minY || y > this.indexLimit.maxY)) {
                    continue;
                }

                if (!this.find(x, y)) {
                    this.addOne(x, y, tileWidth, tileHeight, imageWidth);
                }
            }
        }

        if (!out) {
            out = { minX: xInfo.min, minY: yInfo.min, maxX: xInfo.max, maxY: yInfo.max };
        } else {
            out.minX = xInfo.min;
            out.minY = yInfo.min;
            out.maxX = xInfo.max;
            out.maxY = yInfo.max;
        }

        return out;
    }

    pointer2Index(pointer: PhaserMath.Vector2, tileWidth: number, tileHeight: number, out?: PhaserMath.Vector2) {
        if (!out) {
            out = new PhaserMath.Vector2();
        }

        out.x = Math.floor(pointer.x / tileWidth);
        out.y = Math.floor(pointer.y / tileHeight);

        if (pointer.x < 0) {
            out.x--;
        }
        if (pointer.y < 0) {
            out.y--;
        }

        return out;
    }

    find(xIndex: number, yIndex: number): GameObjects.GameObject | null {
        let children = this.scene.children.getChildren();
        for (let i = 0; i < children.length; i++) {
            let obj = children[i];
            if (obj.getData("kind") == this.kind && obj.getData("x") == xIndex && obj.getData("y") == yIndex) {
                return obj;
            }
        }

        return null;
    }

    addOne(xIndex: number, yIndex: number, tileWidth: number, tileHeight: number, imageWidth: number) {
        let x = tileWidth * xIndex + (tileWidth / 2);
        let y = tileHeight * yIndex + (tileHeight / 2);
        let id = 0;
        if (imageWidth != 0) {
            id = Math.floor(imageWidth / tileWidth + 1) * yIndex + xIndex;
        }

        let rect = this.scene.add.rectangle(x, y, tileWidth, tileHeight, this.fillColor, this.fillAlpha);
        rect.depth = this.depth;
        rect.setStrokeStyle(1, this.strokeColor);
        rect.setData({ "id": id, "kind": this.kind, "x": xIndex, "y": yIndex });
    }
}