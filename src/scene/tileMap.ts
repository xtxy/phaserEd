import { GameObjects, Input, Math as PhaserMath, Scene, Textures, Tilemaps } from "phaser";
import { SceneGrid } from "./grid";
import { LimitRect, SelectRects } from "./rect";
import { TileMap } from "../runtime/tileMap";
import { alignTile, getRandomInt, getTileSetPosByIndex, minMax } from "../util/util";
import { TileMapBrush, TileMapBrushTile } from "../model/tileMap";
import { centerTiles } from "./tile";
import { brush_kind_collision } from "../util/const";
import { Util } from "../runtime/util";
import { SceneUtil } from "./util";

const brush_atlas_name = "brushAtlas";
const brush_container_name = "brushContainer";
const tile_layer_type = "TilemapLayer";
const collision_texture_name = "collisionTexture";
const collision_color = 0xff8080;
const erase_color = 0x8080ff;
const select_color = 0x80ff80;

type UnusedTileSet = {
    name: string,
    firstGid: number
    total: number
};

type UnusedTileSets = {
    names: Set<string>,
    arr: UnusedTileSet[],
};

type ClipTile = {
    layer: string
    x: number
    y: number
    index: number
    rotation: number
};

type ClipTileInfo = {
    x: number
    y: number
    tiles: ClipTile[]
};

type TilePic = {
    x: number
    y: number
    tileSetName: string
    tileSetX: number
    tileSetY: number
    depth: number
    alpha: number
};

type BrushTile = {
    id: number
    x: number
    y: number
}

export class TileMapScene extends Scene {
    private mode: string
    private brushKind: string
    private needRedrawGrid: number
    private shiftKey: Input.Keyboard.Key
    private needShowGrid: boolean
    private grid: SceneGrid
    private selectRects: SelectRects
    private brushContainer: GameObjects.Container
    private paintPos: PhaserMath.Vector2
    private tileMapLoader: TileMap.Loader
    private map?: Tilemaps.Tilemap
    private collisionMap?: Tilemaps.Tilemap
    private lastUpValid: boolean
    private downX: number
    private downY: number
    private cameraX: number
    private cameraY: number
    private cameraMoving: boolean
    private lastPaintX: number
    private lastPaintY: number
    private lastUpX: number
    private lastUpY: number
    private selectRectInfo: LimitRect
    private worldPoint: PhaserMath.Vector2
    private tileSetName: string
    private brushRandomTiles: TileMapBrushTile[]
    private collisionGraphics: GameObjects.Graphics
    private collisionTileSet: Tilemaps.Tileset
    private paintingCollision: boolean
    private clipTileInfo: ClipTileInfo

    isLayerLocked: (name: string) => boolean;
    mouseEnterCallback?: (paintingCollision: boolean) => void;
    pointerMoveCallback?: (x: number, y: number) => void;
    mapSizeChangeCallback?: (width: number, height: number) => void;
    mapDirtyCallback?: () => void;

    create() {
        this.collisionGraphics = this.add.graphics();
        this.collisionGraphics.fillStyle(collision_color);
        this.resizeCollisionTileSet(16, 16);

        this.needRedrawGrid = 0;
        this.input.mouse?.disableContextMenu();
        if (this.input.keyboard) {
            this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false);
        }

        this.grid = new SceneGrid(this, 0, 0x808080, 1);
        this.selectRects = new SelectRects(this, "selectRect", 98, 0xffffff, 0xff0000, 0.5);

        this.brushContainer = this.add.container(10, 10);
        this.brushContainer.setSize(20, 20);
        this.brushContainer.depth = 100;
        this.brushContainer.visible = false;
        this.brushContainer.name = brush_container_name;
        this.brushRandomTiles = [];

        this.needShowGrid = true;
        this.mode = gbData.tileMapPaint;
        this.paintPos = new PhaserMath.Vector2();
        this.tileMapLoader = new TileMap.Loader();
        this.worldPoint = new PhaserMath.Vector2();

        this.selectRectInfo = {
            minX: 0, minY: 0, maxX: 0, maxY: 0,
        };

        this.game.canvas.addEventListener('mouseenter', () => {
            if (!this.map || !this.mouseEnterCallback) {
                return;
            }

            this.mouseEnterCallback(this.paintingCollision);
        });

        this.game.canvas.addEventListener('mouseleave', () => {
            this.brushContainer.visible = false;
            this.lastUpValid = false;
        });

        this.input.on('pointerdown', (pointer: Input.Pointer) => {
            if (!this.map) {
                return;
            }

            this.downX = pointer.x;
            this.downY = pointer.y;

            if (pointer.rightButtonDown()) {
                this.cameraX = this.cameras.main.scrollX;
                this.cameraY = this.cameras.main.scrollY;
                this.cameraMoving = true;
                return;
            }

            let currentLayer = this.getCurrentLayer();
            if (!currentLayer) {
                return;
            }

            this.cameraMoving = false;

            switch (this.mode) {
                case gbData.tileMapPaint:
                case gbData.tileMapErase:
                    {
                        this.cameras.main.getWorldPoint(this.downX, this.downY, this.worldPoint);
                        this.paintPointerDown(this.worldPoint.x, this.worldPoint.y);
                    }
                    break;

                case gbData.tileMapSelect:
                    {
                        if (!this.shiftKey.isDown || !this.lastUpValid) {
                            this.lastUpX = this.downX;
                            this.lastUpY = this.downY;
                            this.lastUpValid = true;

                            this.selectRects.clear();
                        }

                        this.selectRects.add(this.lastUpX, this.lastUpY,
                            this.downX, this.downY, currentLayer.tileWidth, currentLayer.tileHeight, 0,
                            this.selectRectInfo);
                    }
                    break;
            }
        });

        this.input.on('pointermove', (pointer: Input.Pointer) => {
            if (!this.map) {
                return;
            }

            let x = pointer.x;
            let y = pointer.y;

            this.cameras.main.getWorldPoint(x, y, this.worldPoint);

            if (pointer.isDown) {
                if (this.cameraMoving) {
                    let newX = this.cameraX + this.downX - x;
                    let newY = this.cameraY + this.downY - y;
                    this.cameras.main.setScroll(newX, newY);
                    this.drawGrid(false);
                } else if (this.getCurrentLayer()) {
                    switch (this.mode) {
                        case gbData.tileMapPaint:
                            this.cameras.main.getWorldPoint(x, y, this.worldPoint);
                            this.paint(this.worldPoint.x, this.worldPoint.y, false);
                            break;
                    }
                }
            }

            if (this.brushContainer.visible) {
                this.showBrush(this.worldPoint.x, this.worldPoint.y);
            }

            if (this.pointerMoveCallback) {
                this.pointerMoveCallback(this.worldPoint.x, this.worldPoint.y);
            }
        });
    }

    clearAll() {
        this.createBrush();

        if (this.map) {
            this.map.destroy();
            this.map = undefined;
        }
        if (this.collisionMap) {
            this.collisionMap.destroy();
            this.collisionMap = undefined;
        }

        let children = this.children.getChildren();
        for (let i = 0; i < children.length; i++) {
            if (children[i].type != tile_layer_type) {
                continue;
            }

            console.log("destroy child:", children[i].name);

            children[i].destroy(true);
        }

        let keys = this.textures.getTextureKeys();
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key == collision_texture_name) {
                continue;
            }

            console.log("remove texture:", keys[i]);
            this.textures.remove(keys[i]);
        }
    }

    newMap(tileWidth: number, tileHeight: number, width?: number, height?: number) {
        this.clearAll();

        if (!width) {
            width = 50;
        }
        if (!height) {
            height = 50;
        }

        this.map = this.tileMapLoader.create(this, tileWidth, tileHeight, width, height);
        this.paintingCollision = false;
        this.collisionMap = undefined;

        this.drawGrid(true);

        if (this.mapSizeChangeCallback) {
            this.mapSizeChangeCallback(this.map.width, this.map.height);
        }
    }

    async loadMap(mapData: TileMap.MapData) {
        this.clearAll();

        await SceneUtil.checkMapTexture(this, mapData);

        let maps = await this.tileMapLoader.load(this, mapData, false);
        if (!maps) {
            popupMsg("load map error", "error");
            return;
        }

        this.map = maps[0];
        this.paintingCollision = false;

        if (mapData.collision) {
            this.collisionMap = this.tileMapLoader.loadCollisionLayer(this, this.map, mapData.collision,
                this.collisionTileSet, mapData.collision.enable);
        } else {
            this.collisionMap = undefined;
        }

        this.setCurrentLayer(mapData.layers[0].name);
        this.brushContainer.visible = false;

        this.drawGrid(true);
    }

    saveMap(): TileMap.MapData | null {
        if (!this.map || this.map.layers.length == 0 || this.map.tilesets.length == 0) {
            return null;
        }

        let unusedTileSets = this.getUnusedTileSets();

        let layers = [];
        for (let i = 0; i < this.map.layers.length; i++) {
            let layer = this.map.layers[i];
            let layerData = this.saveLayer(layer);

            if (unusedTileSets.arr.length > 0 && layerData.tiles) {
                this.cleanSaveTiles(unusedTileSets.arr, layerData.tiles);
            }

            layers.push(layerData);
        }

        layers.sort((a, b) => {
            return a.depth - b.depth;
        })

        let tileSets: TileMap.TileSet[] = [];
        let firstGidDec = 0;
        for (let i = 0; i < this.map.tilesets.length; i++) {
            let tileSet = this.map.tilesets[i];
            if (unusedTileSets && unusedTileSets.names.has(tileSet.name)) {
                firstGidDec += tileSet.total;
                continue;
            }

            let tileSetData = this.saveTileSet(tileSet, firstGidDec);
            tileSets.push(tileSetData);
        }

        let mapData = new TileMap.MapData({
            version: "1.0",
            width: this.map.width,
            height: this.map.height,
        });

        mapData.layers = layers;
        mapData.tileSets = tileSets;

        if (this.collisionMap) {
            mapData.collision = this.saveCollisionLayer(this.collisionMap.layer);
        }

        return mapData;
    }

    async updateLayers(layerName: string, tileSetName: string, layers: Map<string, TileMap.TileLayer>) {
        this.paintingCollision = false;

        if (!this.map) {
            return;
        }

        let map = this.map as Tilemaps.Tilemap;

        if (tileSetName) {
            if (!this.textures.exists(tileSetName)) {
                let ret = await goLoadImage(tileSetName);
                if (ret.Error) {
                    popupMsg(ret.Error, "error")
                    return;
                }

                let img = await Util.loadImage(ret.Data);
                this.textures.addImage(tileSetName, img);
            }

            this.tileMapLoader.setTilesetImage(map, tileSetName, "auto");
        }

        let mapDirty = false;
        let doneMap = new Set<string>();
        for (let i = 0; i < map.layers.length; ++i) {
            let layer = map.layers[i];
            let mapLayer = layer.tilemapLayer;
            let layerInfo = layers.get(layer.name);
            if (!layerInfo) {
                mapLayer.destroy(true);
                mapDirty = true;
                continue;
            }

            if (tileSetName) {
                let foundTileSet = false;
                for (let j = 0; j < mapLayer.tileset.length; ++j) {
                    if (mapLayer.tileset[j].name == tileSetName) {
                        foundTileSet = true;
                        break;
                    }
                }

                if (!foundTileSet) {
                    this.layerUpdateTileSets(mapLayer);
                    mapDirty = true;
                }
            }

            if (mapLayer.depth != layerInfo.depth) {
                mapLayer.depth = layerInfo.depth;
                mapDirty = true;
            }

            if (mapLayer.visible != layerInfo.visible) {
                mapLayer.visible = layerInfo.visible;
                mapDirty = true;
            }

            doneMap.add(mapLayer.layer.name);
        }

        if (tileSetName) {
            layers.forEach((layerInfo: TileMap.TileLayer, name: string) => {
                if (doneMap.has(name)) {
                    return;
                }

                let mapLayer = map.createBlankLayer(name, map.tilesets, 0, 0, 50, 50,
                    layerInfo.tileWidth, layerInfo.tileHeight);
                if (!mapLayer) {
                    return;
                }

                mapLayer.depth = layerInfo.depth;
                mapLayer.visible = layerInfo.visible;
                mapLayer.setAlpha(layerInfo.alpha);

                mapDirty = true;
            });
        }

        this.setCurrentLayer(layerName);

        if (mapDirty && this.mapDirtyCallback) {
            this.mapDirtyCallback();
        }
    }

    renameLayer(oldName: string, newName: string) {
        if (!this.map) {
            return;
        }

        let mapLayer = this.findLayer(oldName);
        if (!mapLayer) {
            return;
        }

        mapLayer.name = newName;
        mapLayer.layer.name = newName;

        this.map.setLayer(mapLayer);
    }

    createBrush(brush?: TileMapBrush) {
        if (!this.map) {
            return;
        }

        if (!brush) {
            this.brushContainer.setData("hide", true);
            this.brushContainer.visible = false;
            return;
        }

        this.brushKind = brush.kind;
        this.brushContainer.setData("hide", false);

        switch (brush.kind) {
            case brush_kind_collision:
                this.createCollisionBrush();
                break;

            case gbData.tileMapErase:
                this.useColorBrush(erase_color);
                break;

            case gbData.tileMapSelect:
                this.useColorBrush(select_color);
                break;

            default:
                if (brush.tiles.length == 0) {
                    this.brushContainer.setData("hide", true);
                    this.brushContainer.visible = false;
                } else {
                    this.createBrushByInfo(brush);
                }

                break;
        }
    }

    showCurrentBrush() {
        if (this.brushContainer.getData("hide")) {
            console.log("show brush, but it is hided");
            return;
        }

        this.brushContainer.visible = true;
    }

    enableCollisionLayer(collision: TileMap.CollisionLayer) {
        if (!this.map) {
            return;
        }

        if (this.collisionMap) {
            this.collisionMap.layer.tilemapLayer.active = collision.enable;
            this.collisionMap.layer.tilemapLayer.visible = collision.enable;
            return;
        } else if (!collision.enable) {
            return;
        }

        if (!collision.width) {
            collision.width = 50;
        }
        if (!collision.height) {
            collision.height = 50;
        }

        if (collision.tileWidth != this.collisionTileSet.tileWidth || collision.tileHeight != this.collisionTileSet.tileHeight) {
            this.resizeCollisionTileSet(collision.tileWidth, collision.tileHeight);
        }

        this.collisionMap = this.tileMapLoader.loadCollisionLayer(this, this.map, collision, this.collisionTileSet, true);
        if (!this.collisionMap) {
            return;
        }
    }

    updateCollisionLayer(collision: TileMap.CollisionLayer) {
        if (!this.map || !this.collisionMap) {
            return;
        }

        let layer = this.collisionMap.layer;
        layer.name = collision.name;

        if (layer.tileWidth == collision.tileWidth && layer.tileHeight == collision.tileHeight) {
            return;
        }

        this.collisionMap.destroy();
        this.collisionMap = undefined;

        this.enableCollisionLayer(collision);
    }

    startPaintCollision() {
        if (!this.collisionMap) {
            return;
        }

        this.paintingCollision = true;
    }

    showGrid(show: boolean) {
        if (!this.map) {
            return;
        }

        this.needShowGrid = show;
        this.grid.show(show);
    }

    changeMode(mode: string) {
        this.mode = mode;
        if (mode != gbData.tileMapSelect) {
            this.selectRects.clear();
        }
    }

    copySelects() {
        this.doCopySelects(false);
    }

    cutSelects() {
        this.doCopySelects(true);
    }

    pasteSelects() {
        if (!this.clipTileInfo) {
            return;
        }

        let arr = this.selectRects.get();
        if (arr.length != 1) {
            return;
        }

        let deltaX = arr[0].pos.x - this.clipTileInfo.x;
        let deltaY = arr[0].pos.y - this.clipTileInfo.y;

        let layerMap = new Map<string, Tilemaps.TilemapLayer>();
        for (let i = 0; i < this.clipTileInfo.tiles.length; ++i) {
            let tile = this.clipTileInfo.tiles[i];
            let mapLayer = layerMap.get(tile.layer);

            if (!mapLayer) {
                mapLayer = this.findLayer(tile.layer);
                if (!mapLayer) {
                    continue;
                }

                layerMap.set(tile.layer, mapLayer);
            }

            let mapTile = mapLayer.putTileAt(tile.index, tile.x + deltaX, tile.y + deltaY);
            mapTile.rotation = tile.rotation;
        }
    }

    getSelectsAsPic() {
        let tiles: TilePic[] = [];
        let info = this.getSelects((map: Tilemaps.Tilemap, layer: Tilemaps.LayerData, tile: Tilemaps.Tile, pos: PhaserMath.Vector2) => {
            for (let k = 0; k < map.tilesets.length; k++) {
                let tileSet = map.tilesets[k];
                let tileSetPos = getTileSetPosByIndex(tileSet, tile.index);
                if (!tileSetPos) {
                    continue;
                }

                tiles.push({
                    x: pos.x,
                    y: pos.y,
                    tileSetName: tileSet.name,
                    tileSetX: tileSetPos.x,
                    tileSetY: tileSetPos.y,
                    depth: layer.tilemapLayer.depth,
                    alpha: layer.alpha,
                });
            }
        });

        if (!info) {
            return null;
        }

        return {
            tileWidth: info.tileWidth,
            tileHeight: info.tileHeight,
            tiles: tiles,
        }
    }

    switchCollisionVisible(): boolean {
        let map = this.collisionMap;
        if (!map) {
            return false;
        }

        let visible = !map.layer.tilemapLayer.visible;
        map.layer.tilemapLayer.visible = visible;

        return visible;
    }

    private setCurrentLayer(name: string) {
        this.paintingCollision = false;

        if (name == "") {
            return;
        }

        let mapLayer = this.findLayer(name);
        if (this.map && mapLayer) {
            this.map.setLayer(mapLayer);
        }
    }

    private findLayer(name: string): Tilemaps.TilemapLayer | undefined {
        if (!this.map) {
            return undefined;
        }

        let map: Tilemaps.Tilemap;
        if (this.paintingCollision) {
            if (!this.collisionMap) {
                return undefined;
            }

            map = this.collisionMap;
        } else {
            map = this.map;
        }

        for (let i = 0; i < map.layers.length; ++i) {
            if (map.layers[i].name == name) {
                return map.layers[i].tilemapLayer;
            }
        }

        return undefined;
    }

    private createCollisionBrush() {
        this.tileSetName = collision_texture_name;
        this.useColorBrush(collision_color, 0.5);
    }

    private createBrushByInfo(brush: TileMapBrush) {
        if (this.textures.exists(brush_atlas_name)) {
            this.textures.remove(brush_atlas_name);
        }

        this.brushContainer.removeAll(true);

        this.tileSetName = brush.picName;

        switch (this.brushKind) {
            case gbData.tileMapBrushNormal:
                this.createNormalBrush(brush);
                break;

            case gbData.tileMapBrushRandom:
            case gbData.tileMapBrushRandDir:
                this.createRandomBrush(brush);
                break;
        }
    }

    private useColorBrush(color: number, alpha?: number) {
        let layer = this.getCurrentLayer();
        if (!layer) {
            console.log("get current layer fail");
            return;
        }

        this.brushContainer.removeAll(true);

        let rect = this.add.rectangle(0, 0, layer.tileWidth, layer.tileHeight, color, 1);
        this.brushContainer.add(rect);
        this.brushContainer.setSize(layer.tileWidth, layer.tileHeight);
        this.brushContainer.visible = true;

        if (!alpha) {
            this.brushContainer.alpha = 1;
        } else {
            this.brushContainer.alpha = alpha;
        }
    }

    private paintPointerDown(worldPosX: number, worldPosY: number) {
        if (this.shiftKey.isDown && this.lastUpValid) {
            this.batchPaint(worldPosX, worldPosY, this.lastUpX, this.lastUpY);
        } else {
            this.lastUpX = worldPosX;
            this.lastUpY = worldPosY;
            this.lastUpValid = true;

            this.paint(worldPosX, worldPosY, true);
        }
    }

    private drawGrid(force: boolean) {
        if (!this.map) {
            return;
        }

        let tileWidth, tileHeight;
        if (this.map.layer) {
            tileWidth = this.map.layer.tileWidth;
            tileHeight = this.map.layer.tileHeight;
        } else {
            tileWidth = this.map.tileWidth;
            tileHeight = this.map.tileHeight;
        }

        this.grid.draw(tileWidth, tileHeight, force);
        this.grid.show(this.needShowGrid);
    }

    private batchPaint(x1: number, y1: number, x2: number, y2: number) {
        let map = this.getPaintMap();
        if (!map) {
            return;
        }

        let tilePos1 = map.worldToTileXY(x1, y1, true);
        let tilePos2 = map.worldToTileXY(x2, y2, true);

        if (!tilePos1 || !tilePos2) {
            popupMsg("internal error", "error");
            return;
        }

        let xInfo = minMax(tilePos1.x, tilePos2.x);
        let yInfo = minMax(tilePos1.y, tilePos2.y);

        let del = this.brushKind == gbData.tileMapErase;
        if (del) {
            map.removeTileAt(xInfo.min, yInfo.min);
            map.removeTileAt(xInfo.max, yInfo.max);
        } else {
            this.putTilesByBrush(map, xInfo.min, yInfo.min);
            this.putTilesByBrush(map, xInfo.max, yInfo.max);
        }

        for (let x = xInfo.min; x <= xInfo.max; x++) {
            for (let y = yInfo.min; y <= yInfo.max; y++) {
                if (x == xInfo.min && y == yInfo.min || x == xInfo.max && y == yInfo.max) {
                    continue;
                }

                if (del) {
                    map.removeTileAt(x, y);
                } else {
                    this.putTilesByBrush(map, x, y);
                }
            }
        }
    }

    private paint(worldPosX: number, worldPosY: number, start: boolean) {
        let map = this.getPaintMap();
        if (!map) {
            return;
        }

        map.worldToTileXY(worldPosX, worldPosY, true, this.paintPos);

        if (!start && this.lastPaintX == this.paintPos.x && this.lastPaintY == this.paintPos.y) {
            return;
        }

        this.lastPaintX = this.paintPos.x;
        this.lastPaintY = this.paintPos.y;

        switch (this.brushKind) {
            case gbData.tileMapErase:
                map.removeTileAt(this.lastPaintX, this.lastPaintY);
                break;

            default:
                this.putTilesByBrush(map, this.lastPaintX, this.lastPaintY);
                break;
        }

        if (this.mapDirtyCallback) {
            this.mapDirtyCallback();
        }
    }

    private showBrush(x: number, y: number) {
        let currentLayer = this.getCurrentLayer();
        if (!currentLayer) {
            return;
        }

        let tileWidth = currentLayer.tileWidth;
        let tileHeight = currentLayer.tileHeight;

        x = alignTile(x, tileWidth);
        y = alignTile(y, tileHeight);

        this.brushContainer.setPosition(x + tileWidth / 2, y + tileHeight / 2);
    }

    private getPaintMap(): Tilemaps.Tilemap | undefined {
        if (!this.brushContainer.visible || !this.map) {
            return undefined;
        }

        if (this.paintingCollision) {
            return this.collisionMap;
        }

        let map = this.map as Tilemaps.Tilemap;

        if (!map.layer || this.isLayerLocked(map.layer.name)) {
            popupMsg("can not paint current layer", "error");
            return undefined;
        }

        return map;
    }

    private getCurrentLayer(): Tilemaps.LayerData | undefined {
        if (this.paintingCollision) {
            return this.collisionMap?.layer;
        }

        return this.map?.layer;
    }

    private putTilesByBrush(map: Tilemaps.Tilemap, tileX: number, tileY: number) {
        let tiles = [];
        let left = 0, top = 0, right = 0, down = 0;

        let tileSet = map.getTileset(this.tileSetName);
        if (!tileSet) {
            return;
        }

        let brushTiles = this.getBrushTiles();
        for (let i = 0; i < brushTiles.length; ++i) {
            let brushTile = brushTiles[i];
            let x = tileX + brushTile.x;
            let y = tileY + brushTile.y;
            let id = brushTile.id + tileSet.firstgid;

            if (x < 0 && -x > left) {
                left = -x;
            } else {
                let delta = x + 1 - map.layer.width;
                if (delta > right) {
                    right = delta;
                }
            }

            if (y < 0 && -y > top) {
                top = -y;
            } else {
                let delta = y + 1 - map.layer.height;
                if (delta > down) {
                    down = delta;
                }
            }

            tiles.push({ id: id, x: x, y: y });
        }

        if (left > 0 || top > 0 || right > 0 || down > 0) {
            this.resizeLayer(map.layer, left, top, right, down, map.layer.tileWidth, map.layer.tileHeight);
            map.width = map.layer.width;
            map.height = map.layer.height;

            if (this.mapSizeChangeCallback) {
                this.mapSizeChangeCallback(map.width, map.height);
            }
        }

        for (let i = 0; i < tiles.length; i++) {
            let tile = map.putTileAt(tiles[i].id, tiles[i].x + left, tiles[i].y + top);
            if (tile && this.brushKind == gbData.tileMapBrushRandDir) {
                tile.rotation = getRandomInt(4) * Math.PI / 2;
            }
        }
    }

    private getTileId(tile: GameObjects.GameObject): number {
        switch (this.brushKind) {
            case gbData.tileMapBrushRandom:
            case gbData.tileMapBrushRandDir:
                let index = getRandomInt(this.brushRandomTiles.length);
                return this.brushRandomTiles[index].id;
        }

        return tile.getData("id") as number;
    }

    private getUnusedTileSets(): UnusedTileSets {
        let map = this.map as Tilemaps.Tilemap

        let validTileSets = new Set<string>();
        for (let i = 0; i < map.layers.length; i++) {
            let layer = map.layers[i];
            for (let y = 0; y < layer.data.length; y++) {
                for (let x = 0; x < layer.data[y].length; x++) {
                    let tile = layer.data[y][x];
                    if (!tile || tile.index < 0) {
                        continue;
                    }

                    let tileSet = layer.tilemapLayer.gidMap[tile.index];
                    validTileSets.add(tileSet.name);
                }
            }
        }

        let unusedTileSets: UnusedTileSets = {
            names: new Set<string>(),
            arr: [],
        };
        for (let i = 0; i < map.tilesets.length; i++) {
            let tileSet = map.tilesets[i];
            if (validTileSets.has(tileSet.name)) {
                continue;
            }

            unusedTileSets.names.add(tileSet.name);
            unusedTileSets.arr.push({
                name: tileSet.name,
                firstGid: tileSet.firstgid,
                total: tileSet.total,
            });
        }

        return unusedTileSets;
    }

    private saveLayer(layer: Tilemaps.LayerData): TileMap.TileLayer {
        let tiles = new Map<string, TileMap.Tile>();
        for (let y = 0; y < layer.data.length; y++) {
            for (let x = 0; x < layer.data[y].length; x++) {
                let tile = layer.data[y][x];
                if (!tile || tile.index < 0) {
                    continue;
                }

                let tileData = new TileMap.Tile();
                tileData.index = tile.index;
                if (tile.rotation) {
                    tileData.rotation = tile.rotation;
                }

                let key = x + "_" + y;
                tiles.set(key, tileData);
            }
        }

        let config = {
            x: layer.x, y: layer.y, width: layer.width, height: layer.height,
            name: layer.name, tileWidth: layer.tileWidth, tileHeight: layer.tileHeight,
            visible: layer.tilemapLayer.visible, depth: layer.tilemapLayer.depth,
            alpha: layer.tilemapLayer.alpha,
        };

        let ret = new TileMap.TileLayer(config);
        ret.tiles = tiles;

        return ret;
    }

    private saveCollisionLayer(layer: Tilemaps.LayerData): TileMap.CollisionLayer {
        let tiles = new Map<string, number>();
        for (let y = 0; y < layer.data.length; y++) {
            for (let x = 0; x < layer.data[y].length; x++) {
                let tile = layer.data[y][x];
                if (!tile || tile.index < 0) {
                    continue;
                }

                let key = x + "_" + y;
                tiles.set(key, tile.index);
            }
        }

        let config = {
            x: layer.x, y: layer.y, width: layer.width, height: layer.height,
            name: layer.name, tileWidth: layer.tileWidth, tileHeight: layer.tileHeight,
        };

        let ret = new TileMap.CollisionLayer(config);
        ret.tiles = tiles;

        return ret;
    }

    private cleanSaveTiles(unusedTileSets: UnusedTileSet[], tiles: Map<string, TileMap.Tile>) {
        tiles.forEach((tile: TileMap.Tile) => {
            let index = tile.index;
            let dec = 0;
            for (let i = 0; i < unusedTileSets.length; ++i) {
                if (index < unusedTileSets[i].firstGid) {
                    break;
                }

                dec += unusedTileSets[i].total;
            }

            tile.index -= dec;
        });
    }

    private saveTileSet(tileSet: Tilemaps.Tileset, firstGidDec: number): TileMap.TileSet {
        let image = tileSet.image as Textures.Texture;

        return new TileMap.TileSet({
            firstgid: tileSet.firstgid - firstGidDec,
            tilewidth: tileSet.tileWidth,
            tileheight: tileSet.tileHeight,
            image: tileSet.name,
            imagewidth: image.source[0].width,
            imageheight: image.source[0].height,
            total: tileSet.total,
        });
    }

    private resizeLayer(layer: Tilemaps.LayerData, left: number, top: number, right: number, down: number,
        tileWidth: number, tileHeight: number) {
        if (left > 0) {
            for (let y = 0; y < layer.data.length; ++y) {
                for (let x = left - 1; x >= 0; --x) {
                    let tile = new Phaser.Tilemaps.Tile(layer, -1, x, y,
                        layer.tileWidth, layer.tileHeight, tileWidth, tileHeight);
                    layer.data[y].unshift(tile);
                }
                for (let x = left; x < layer.data[y].length; x++) {
                    layer.data[y][x].x += left;
                    layer.data[y][x].updatePixelXY();
                }
            }

            layer.x -= left * layer.tileWidth;

            if (layer.tilemapLayer) {
                layer.tilemapLayer.x = layer.x;
            }
        }

        if (right > 0) {
            for (let y = 0; y < layer.data.length; ++y) {
                for (let x = 0; x < right; ++x) {
                    let tile = new Phaser.Tilemaps.Tile(layer, -1, layer.data[y].length, y,
                        layer.tileWidth, layer.tileHeight, tileWidth, tileHeight);
                    layer.data[y].push(tile);
                }
            }
        }

        if (top > 0) {
            for (let y = top - 1; y >= 0; --y) {
                let row = [];
                for (let x = 0; x < layer.data[0].length; ++x) {
                    let tile = new Phaser.Tilemaps.Tile(layer, -1, x, y,
                        layer.tileWidth, layer.tileHeight, tileWidth, tileHeight);
                    row.push(tile);
                }

                layer.data.unshift(row);
            }
            for (let y = top; y < layer.data.length; ++y) {
                for (let x = 0; x < layer.data[y].length; ++x) {
                    layer.data[y][x].y += top;
                    layer.data[y][x].updatePixelXY();
                }
            }

            layer.y -= top * layer.tileHeight;

            if (layer.tilemapLayer) {
                layer.tilemapLayer.y = layer.y;
            }
        }

        if (down > 0) {
            for (let y = 0; y < down; ++y) {
                let row = [];
                for (let x = 0; x < layer.data[0].length; ++x) {
                    let tile = new Phaser.Tilemaps.Tile(layer, -1, x, layer.data.length,
                        layer.tileWidth, layer.tileHeight, tileWidth, tileHeight);
                    row.push(tile);
                }

                layer.data.push(row);
            }
        }

        layer.width = layer.data[0].length;
        layer.height = layer.data.length;
    }

    private layerUpdateTileSets(layer: Tilemaps.TilemapLayer) {
        let gidMap: Tilemaps.Tileset[] = [];
        let setList: Tilemaps.Tileset[] = [];

        for (let i = 0; i < layer.tilemap.tilesets.length; ++i) {
            let tileSet = layer.tilemap.tilesets[i];
            setList.push(tileSet);

            let startId = tileSet.firstgid;
            for (let j = 0; j < tileSet.total; ++j) {
                gidMap[startId + j] = tileSet;
            }
        }

        layer.gidMap = gidMap;
        layer.tileset = setList;
    }

    private createNormalBrush(brush: TileMapBrush) {
        let frames = [];

        for (let i = 0; i < brush.tiles.length; i++) {
            let tile = brush.tiles[i];
            frames.push({
                filename: tile.name,
                frame: {
                    x: tile.pos.x * brush.tileWidth,
                    y: tile.pos.y * brush.tileHeight,
                    w: brush.tileWidth,
                    h: brush.tileHeight,
                }
            });
        }

        this.setBrushContainer(frames, brush);
    }

    private createRandomBrush(brush: TileMapBrush) {
        let frames = [
            {
                filename: brush.tiles[0].name,
                frame: {
                    x: brush.tiles[0].pos.x * brush.tileWidth,
                    y: brush.tiles[0].pos.y * brush.tileHeight,
                    w: brush.tileWidth,
                    h: brush.tileHeight,
                }
            }
        ];

        this.brushRandomTiles = brush.tiles;
        this.setBrushContainer(frames, brush, [brush.tiles[0]]);
    }

    private setBrushContainer(frames: object[], brush: TileMapBrush, tiles?: TileMapBrushTile[]) {
        let imageData = this.textures.get(this.tileSetName);
        let source = imageData.getSourceImage() as HTMLImageElement;

        let atlasData = {
            frames: frames,
            meta: {
                image: brush.picName,
                size: { w: source.width, h: source.height },
            },
        };

        let atlasTexture = this.textures.addAtlas(brush_atlas_name, source, atlasData);
        if (!atlasTexture) {
            console.error("add altlas fail");
            return;
        }

        if (!tiles) {
            tiles = brush.tiles;
        }

        let ret = centerTiles(tiles, brush.tileWidth, brush.tileHeight);
        for (let i = 0; i < tiles.length; ++i) {
            let tile = tiles[i];

            let sprite = this.add.sprite(ret.relativePos[i].x, ret.relativePos[i].y,
                atlasTexture, tile.name);
            sprite.setData({
                "id": tile.id,
                "relativeX": ret.relative[i].x,
                "relativeY": ret.relative[i].y,
            });
            this.brushContainer.add(sprite);
        }

        this.brushContainer.setSize(ret.size.x, ret.size.y);
        this.brushContainer.visible = true;
        this.brushContainer.alpha = brush.alpha;
    }

    private getSelects(action: (map: Tilemaps.Tilemap, layer: Tilemaps.LayerData, tile: Tilemaps.Tile, pos: PhaserMath.Vector2) => void) {
        let map: Tilemaps.Tilemap | null | undefined;

        if (this.paintingCollision) {
            map = this.collisionMap;
        } else {
            map = this.map;
        }

        if (!map) {
            return null;
        }

        let selects = this.selectRects.get();
        if (selects.length < 2) {
            return null;
        }

        let minX = selects[0].pos.x;
        let minY = selects[0].pos.y;

        for (let i = 0; i < map.layers.length; ++i) {
            let currentLayer = map.layers[i];
            if (!currentLayer.visible || currentLayer.alpha == 0 ||
                currentLayer.tileWidth != map.layer.tileWidth ||
                currentLayer.tileHeight != map.layer.tileHeight) {
                continue;
            }

            for (let j = 0; j < selects.length; j++) {
                let pos = selects[j].pos;
                let x = pos.x;
                let y = pos.y;

                if (x < minX) {
                    minX = x;
                }
                if (y < minY) {
                    minY = y;
                }

                let tile = currentLayer.tilemapLayer.getTileAt(x, y);
                if (!tile || tile.index < 0) {
                    continue;
                }

                action(map, currentLayer, tile, pos);
            }
        }

        return {
            x: minX, y: minY, tileWidth:
                map.layer.tileWidth, tileHeight: map.layer.tileHeight,
        };
    }

    private doCopySelects(cut: boolean) {
        let clipTiles: ClipTile[] = [];
        let info = this.getSelects((map: Tilemaps.Tilemap, layer: Tilemaps.LayerData, tile: Tilemaps.Tile, pos: PhaserMath.Vector2) => {
            clipTiles.push({
                layer: layer.name,
                x: pos.x,
                y: pos.y,
                index: tile.index,
                rotation: tile.rotation,
            });

            if (cut) {
                layer.tilemapLayer.removeTileAt(pos.x, pos.y);
            }
        });

        if (!info) {
            return;
        }

        this.clipTileInfo = {
            x: info.x, y: info.y, tiles: clipTiles,
        };
    }

    private getBrushTiles(): BrushTile[] {
        if (this.paintingCollision) {
            return [{
                x: 0, y: 0, id: 0,
            }];
        }

        let ret: BrushTile[] = [];
        for (let i = 0; i < this.brushContainer.length; ++i) {
            let tile = this.brushContainer.list[i];

            let x = tile.getData("relativeX") as number;
            let y = tile.getData("relativeY") as number;
            let id = this.getTileId(tile);

            ret.push({
                x: x, y: y, id: id,
            });
        }

        return ret;
    }

    private resizeCollisionTileSet(tileWidth: number, tileHeight: number) {
        if (this.textures.exists(collision_texture_name)) {
            this.textures.remove(collision_texture_name);
        }

        this.collisionGraphics.fillRect(0, 0, tileWidth, tileHeight);
        this.collisionGraphics.generateTexture(collision_texture_name, tileWidth, tileHeight);
        this.collisionGraphics.visible = false;

        this.collisionTileSet = new Tilemaps.Tileset(collision_texture_name, 0, tileWidth, tileHeight);
        this.collisionTileSet.setImage(this.textures.get(collision_texture_name));
    }

    update() {
        if (this.needRedrawGrid > 0) {
            --this.needRedrawGrid;
            this.drawGrid(true);
        }
    }
}