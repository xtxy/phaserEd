import { Game } from "phaser";
import { TileMapCtrl } from "../ctrl/tileMap";
import { Evt, eventManager } from "../util/event";
import { TileMapScene } from "../scene/tileMap";
import { ModelMgr } from "../model/base";
import { FileListModel } from "../model/fileList";
import { TileMap } from "../runtime/tileMap";
import { TileLayerRenameParam, TileMapBrush } from "../model/tileMap";
import { brush_kind_collision } from "../util/const";

const tile_map_brush_max_cache_num = 20;

export class TileMapView {
    ctrl: TileMapCtrl
    game?: Game
    dirty: boolean

    constructor(ctrl: TileMapCtrl) {
        this.ctrl = ctrl;
        this.dirty = false;

        eventManager.register(Evt.tileMapShow, this);
        eventManager.register(Evt.tileMapNew, this);
        eventManager.register(Evt.tileMapLoadDone, this);
        eventManager.register(Evt.tileMapSaveDone, this);
        eventManager.register(Evt.tileMapCloseDone, this);
        eventManager.register(Evt.tileSetLoadDone, this);
        eventManager.register(Evt.tileLayerUpdate, this);
        eventManager.register(Evt.tileLayerRename, this);
        eventManager.register(Evt.tileMapBrushChange, this);
        eventManager.register(Evt.tileMapEnableCollision, this);
        eventManager.register(Evt.tileMapPaintCollision, this);
        eventManager.register(Evt.tileMapUpdateCollision, this);
    }

    processEvent(evt: Evt, param: any) {
        switch (evt) {
            case Evt.tileMapShow:
                this.onShow();
                break;

            case Evt.tileMapLoadDone:
                this.onLoadDone();
                break;

            case Evt.tileMapSaveDone:
                this.onSaveMap();
                break;

            case Evt.tileMapCloseDone:
                this.onCloseMap();
                break;

            case Evt.tileMapNew:
                this.onNewMap();
                break;

            case Evt.tileSetLoadDone:
            case Evt.tileLayerUpdate:
                this.onUpdateLayer();
                break;

            case Evt.tileLayerRename:
                this.onRenameLayer(param as TileLayerRenameParam);
                break;

            case Evt.tileMapBrushChange:
                this.onUpdateBrush();
                break;

            case Evt.tileMapEnableCollision:
                this.onEnableCollision();
                break;

            case Evt.tileMapPaintCollision:
                this.onPaintCollision();
                break;

            case Evt.tileMapUpdateCollision:
                this.onUpdateCollision();
                break;
        }
    }

    show() {
        this.ctrl.show();
    }

    loadTileMap() {
        let item = uiItem("fileList").getSelectedItem();
        if (!item) {
            return;
        }

        if (!item.Name.endsWith(".json")) {
            popupMsg("tile map type error", "error");
            return;
        }

        let fileListModel = ModelMgr.get(FileListModel);
        let name = fileListModel.currentDir + "/" + item.Name;
        if (this.dirty) {
            uiConfirm({
                title: "Load Tile Map",
                text: "Discard current map change?",
                ok: "Yes",
                cancel: "No",
            }).then(() => {
                this.tryLoadTileMap(name);
            });
        } else {
            this.tryLoadTileMap(name);
        }
    }

    saveTileMap() {
        let map = this.getScene().saveMap();
        if (!map) {
            popupMsg("map empty", "error");
            return;
        }

        if (!this.ctrl.model.name) {
            this.saveNewTileMap(map);
            return;
        }

        this.ctrl.saveTileMap(this.ctrl.model.name, map);
    }

    closeTileMap() {
        uiConfirm({
            title: "Close Tile Map",
            text: "Close current tile map?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            this.ctrl.closeTileMap();
        });
    }

    showGrid(value: number) {
        this.getScene().showGrid(value ? true : false);
    }

    showPointerPos(x: number, y: number) {
        uiItem("tileMapPointerPos").setValue("x: " + x + ", y: " + y);
    }

    sizeChange(width: number, height: number) {
        uiItem("tileMapSizeLabel").setValue("width: " + width + ", height: " + height);
    }

    mapDirty() {
        this.dirty = true;
        let name = this.ctrl.model.name;
        if (!name) {
            name = "new tile map";
        }

        uiItem("tileMapNameLabel").setHTML("<font color='#ff9700'>" + name + " *</font>");
    }

    isLayerLocked(name: string): boolean {
        return this.ctrl.isLayerLocked(name);
    }

    delBrushCache() {
        let item = uiItem("tileMapBrushCacheList").getSelectedItem();
        if (!item) {
            return;
        }

        uiItem("tileMapBrushCacheList").remove(item.id);
    }

    changeMode(mode: string) {
        this.getScene().changeMode(mode);

        switch (mode) {
            case gbData.tileMapSelect:
                uiItem("tileMapSelectToolBar").show();
                break;

            default:
                uiItem("tileMapPaintToolBar").show();
                break;
        }
    }

    copySelects() {
        this.getScene().copySelects();
    }

    cutSelects() {
        this.getScene().cutSelects();
    }

    pasteSelects() {
        this.getScene().pasteSelects();
    }

    async createImageFromSelects() {
        let info = this.getScene().getSelectsAsPic();
        if (!info) {
            return;
        }

        uiPrompt({
            title: "Save Select Image",
            text: "Save image to current folder",
            ok: "Ok",
            cancel: "Cancel",
            input: {
                required: true,
                value: "",
                placeholder: "file name"
            }
        }).then((name: string) => {
            if (!name.endsWith(".png")) {
                name += ".png"
            }

            let dir = ModelMgr.get(FileListModel).currentDir;
            this.ctrl.saveTileMapSelect(dir + "/" + name, info.tileWidth, info.tileHeight, info.tiles);
        });
    }

    switchCollisionVisible() {
        let visible = this.getScene().switchCollisionVisible();
        this.ctrl.model.postEvent(Evt.tileMapShowCollision, visible);
    }

    private saveNewTileMap(map: TileMap.MapData) {
        uiPrompt({
            title: "Save Map",
            text: "Save map to current folder",
            ok: "Ok",
            cancel: "Cancel",
            input: {
                required: true,
                value: "",
                placeholder: "map name",
            }
        }).then((name: string) => {
            if (!name.endsWith(".json")) {
                name += ".json"
            }

            name = ModelMgr.get(FileListModel).currentDir + "/" + name;
            this.ctrl.saveTileMap(name, map);
        });
    }

    private tryLoadTileMap(name: string) {
        uiConfirm({
            title: "Load Tile Map",
            text: "Load " + name + "?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            this.ctrl.loadTileMap(name);
        });
    }

    private onShow() {
        uiItem("tileMapBrushCachePage").show();

        if (this.game) {
            return;
        }

        let sceneObj = new TileMapScene();
        sceneObj.pointerMoveCallback = this.showPointerPos.bind(this);
        sceneObj.mapSizeChangeCallback = this.sizeChange.bind(this);
        sceneObj.mapDirtyCallback = this.mapDirty.bind(this);
        sceneObj.isLayerLocked = this.isLayerLocked.bind(this);
        sceneObj.mouseEnterCallback = this.mouseEnter.bind(this);

        let config = {
            type: Phaser.WEBGL,
            parent: gbData.tileMapDiv,
            width: 1024,
            height: 768,
            scene: sceneObj,
        };

        this.game = new Phaser.Game(config);
    }

    private onLoadDone() {
        this.getScene().loadMap(this.ctrl.model.mapData as TileMap.MapData);
    }

    private onNewMap() {
        let mapData = this.ctrl.model.mapData as TileMap.MapData;
        let layer = mapData.layers[0];
        this.getScene().newMap(layer.tileWidth, layer.tileHeight);

        uiItem("tileMapScale").setValue(100);

        let name = this.ctrl.model.name;
        if (!name) {
            name = "new map";
        }

        uiItem("tileMapNameLabel").setValue(name);
    }

    private onSaveMap() {
        this.dirty = false;
        uiItem("tileMapNameLabel").setHTML("<font color='#000000'>" + this.ctrl.model.name + "</font>");;
    }

    private onCloseMap() {
        uiItem("tileMapNameLabel").setHTML("");
        this.getScene().clearAll();
    }

    private onUpdateLayer() {
        let layerName = "";
        let currentLayer = this.ctrl.model.getCurrentLayer();
        if (currentLayer) {
            layerName = currentLayer.name;
        }

        let layers = new Map<string, TileMap.TileLayer>();
        let mapData = this.ctrl.model.mapData as TileMap.MapData;
        for (let i = 0; i < mapData.layers.length; ++i) {
            let layer = mapData.layers[i];
            layer.depth = i;
            layers.set(layer.name, layer);
        }

        this.getScene().updateLayers(layerName, this.ctrl.model.tileSetName, layers);
    }

    private onRenameLayer(param: TileLayerRenameParam) {
        this.getScene().renameLayer(param.oldName, param.newName);

        if (param.index >= 0) {
            this.onUpdateLayer();
        }
    }

    private onUpdateBrush() {
        if (!this.ctrl.model.brushChange) {
            this.getScene().showCurrentBrush();
            return;
        }

        let brush = this.ctrl.model.brush;
        this.getScene().createBrush(brush);

        if (brush && brush.kind == gbData.tileMapBrushNormal &&
            brush.tiles.length > 1) {
            let item = this.findBrushFromCache(brush);
            if (item) {
                uiItem("tileMapBrushCacheList").move(item.id, 0);
            } else {
                this.addBrushCache(brush);
            }
        }
    }

    private onEnableCollision() {
        let mapData = this.ctrl.model.mapData as TileMap.MapData;
        this.getScene().enableCollisionLayer(mapData.collision);
    }

    private onPaintCollision() {
        this.getScene().startPaintCollision();
    }

    private onUpdateCollision() {
        let mapData = this.ctrl.model.mapData as TileMap.MapData;
        this.getScene().updateCollisionLayer(mapData.collision);
    }

    private mouseEnter(paintingCollision: boolean) {
        let tileMapMode = uiItem("tileMapMode").getValue();
        let brush: TileMapBrush;

        switch (tileMapMode) {
            case gbData.tileMapErase:
            case gbData.tileMapSelect:
                brush = new TileMapBrush(tileMapMode);
                break;

            default:
                if (paintingCollision) {
                    brush = new TileMapBrush(brush_kind_collision);
                } else {
                    let item = uiItem("tileMapBrushCacheList").getSelectedItem();
                    if (!item) {
                        this.ctrl.model.sendEvent(Evt.tileMapCreateBrushByTileSet);
                        return;
                    }

                    uiItem("tileMapBrushCacheList").unselectAll();

                    brush = new TileMapBrush(gbData.tileMapBrushNormal, item.picName,
                        item.tileWidth, item.tileHeight, 1, item.tiles);
                }
                break;
        }

        this.ctrl.setBrush(brush);
    }

    private getScene(): TileMapScene {
        let game = this.game as Game;
        return game.scene.getAt(0) as TileMapScene;
    }

    private findBrushFromCache(brush: TileMapBrush): any {
        let item = uiItem("tileMapBrushCacheList").find((obj: any) => {
            if (obj.picName != brush.picName || obj.tiles.length != brush.tiles.length) {
                return false;
            }

            for (let i = 0; i < brush.tiles.length; i++) {
                if (brush.tiles[i].id != obj.tiles[i].id) {
                    return false;
                }
            }

            return true;

        }, true);

        return item;
    }

    private async addBrushCache(brush: TileMapBrush) {
        let tiles = [];
        for (let i = 0; i < brush.tiles.length; ++i) {
            tiles.push({
                X: brush.tiles[i].pos.x,
                Y: brush.tiles[i].pos.y,
            });
        }

        let ret = await goCombineTiles(brush.picName, brush.tileWidth, brush.tileHeight, tiles);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        let brushCache = brush.clone();
        brushCache.img = ret.Data as string;

        uiItem("tileMapBrushCacheList").add(brushCache, 0);
        if (uiItem("tileMapBrushCacheList").count() > tile_map_brush_max_cache_num) {
            let item = uiItem("tileMapBrushCacheList").getIdByIndex(tile_map_brush_max_cache_num);
            if (item) {
                uiItem("tileMapBrushCacheList").remove(item.id);
            }
        }
    }
}