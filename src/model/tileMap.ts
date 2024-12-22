import { TileMap } from "../runtime/tileMap";
import { Evt } from "../util/event";
import { BaseModel } from "./base";
import { Math as PhaserMath } from "phaser";

export type TileLayerRenameParam = {
    oldName: string,
    newName: string,
    index: number,
};

export class TileMapBrushTile {
    id: number
    name: string
    pos: PhaserMath.Vector2

    constructor(id: number, x: number, y: number) {
        this.id = id;
        this.name = x + "_" + y;
        this.pos = new PhaserMath.Vector2(x, y);        
    }
}

export class TileMapBrush {
    kind: string
    picName: string
    tileWidth: number
    tileHeight: number
    alpha: number
    tiles: TileMapBrushTile[]
    img: string

    constructor(kind: string, picName?: string, tileWidth?: number, tileHeight?: number, alpha?: number, tiles?: TileMapBrushTile[]) {
        this.kind = kind;
        this.picName = picName || "";
        this.tileWidth = tileWidth || 0;
        this.tileHeight = tileHeight || 0;
        this.alpha = alpha || 1;

        if (tiles) {
            this.tiles = tiles;
            this.sortTiles();
        } else {
            this.tiles = [];
        }
    }

    clone(): TileMapBrush {
        let brush = new TileMapBrush(this.kind, this.picName, this.tileWidth, this.tileHeight, this.alpha);
        brush.tiles = this.tiles;
        return brush;
    }

    different(brush: TileMapBrush): boolean {
        if (this.kind != brush.kind ||
            this.picName != brush.picName ||
            this.tiles.length != brush.tiles.length) {
            return true;
        }

        for (let i = 0; i < brush.tiles.length; i++) {
            if (this.tiles[i].pos.x != brush.tiles[i].pos.x ||
                this.tiles[i].pos.y != brush.tiles[i].pos.y) {
                return true;
            }
        }

        return false;
    }

    sortTiles() {
        this.tiles.sort((a, b) => {
            if (a.pos.y < b.pos.y) {
                return -1;
            } else if (a.pos.y > b.pos.y) {
                return 1;
            } else if (a.pos.x < b.pos.x) {
                return -1;
            } else if (a.pos.x > b.pos.x) {
                return 1;
            }

            return 0;
        });
    }
}

export class LayerEditInfo {
    index: number
    lock: boolean

    constructor(index: number) {
        this.index = index;
        this.lock = false;
    }
}

export class TileMapModel extends BaseModel {
    name: string
    brush?: TileMapBrush
    brushChange: boolean
    mapData?: TileMap.MapData
    currentLayerIndex: number
    layerEdit: Map<string, LayerEditInfo>
    tileSetName: string
    tileSetPicData: string
    tileSetInterval: number

    setBrush(brush: TileMapBrush) {
        if (this.isBrushChange(brush)) {
            this.brush = brush;
            this.brushChange = true;
        } else {
            this.brushChange = false;
        }

        console.log("model set brush, kind:", brush.kind, "change:", this.brushChange);

        this.postEvent(Evt.tileMapBrushChange);
    }

    isBrushChange(brush: TileMapBrush): boolean {
        if (!this.brush) {
            return true;
        }

        return this.brush.different(brush);
    }

    getCurrentLayer(): TileMap.TileLayer | null {
        if (!this.mapData || this.mapData.layers.length == 0) {
            return null;
        }

        if (this.currentLayerIndex < 0 || this.currentLayerIndex >= this.mapData.layers.length) {
            return null;
        }

        return this.mapData.layers[this.currentLayerIndex];
    }

    addTileLayer(layer: TileMap.TileLayer) {
        let mapData = this.mapData as TileMap.MapData;
        mapData.layers.push(layer);

        this.currentLayerIndex = mapData.layers.length - 1;
        let info = new LayerEditInfo(this.currentLayerIndex);
        this.layerEdit.set(layer.name, info);
    }

    resetEditInfo() {
        this.layerEdit = new Map<string, LayerEditInfo>();
        if (!this.mapData) {
            return;
        }

        let map = this.mapData as TileMap.MapData;
        for (let i = 0; i < map.layers.length; ++i) {
            let info = new LayerEditInfo(i);
            this.layerEdit.set(map.layers[i].name, info);
        }
    }

    renameEditInfo(oldName: string, newName: string, info: LayerEditInfo) {
        this.layerEdit.delete(oldName);
        this.layerEdit.set(newName, info);
    }

    reorderEditInfo() {
        let map = this.mapData as TileMap.MapData;
        for (let i = 0; i < map.layers.length; ++i) {
            let info = this.layerEdit.get(map.layers[i].name) as LayerEditInfo;
            info.index = i;
        }
    }
}