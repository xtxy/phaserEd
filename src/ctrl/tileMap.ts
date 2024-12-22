import { LayerEditInfo, TileMapModel, TileMapBrush } from "../model/tileMap";
import { TileMap } from "../runtime/tileMap";
import { Evt } from "../util/event";
import { loadJsonFile } from "../util/util";

export class TileMapCtrl {
    model: TileMapModel

    constructor(model: TileMapModel) {
        this.model = model;
    }

    show() {
        this.model.postEvent(Evt.tileMapShow);
    }

    showEdit() {
        this.model.postEvent(Evt.tileMapEditShow);
    }

    newTileMap(layer: TileMap.TileLayer) {
        if (!this.isValidLayer(layer)) {
            popupMsg("param error", "error");
            return;
        }

        this.model.name = "";
        this.model.currentLayerIndex = 0;
        this.model.mapData = new TileMap.MapData();
        this.model.mapData.layers = [layer];

        this.model.resetEditInfo();

        this.model.postEvent(Evt.tileMapNew);
    }

    async loadTileMap(name: string) {
        let obj = await loadJsonFile(name);
        if (!obj) {
            popupMsg("load tile map failed", "error");
            return;
        }

        if (obj.kind != "tileMap") {
            popupMsg("not tile map", "error");
            return;
        }

        this.model.mapData = new TileMap.MapData(obj);
        this.model.name = name;
        this.model.currentLayerIndex = 0;

        this.model.resetEditInfo();

        this.model.postEvent(Evt.tileMapLoadDone);
    }

    async saveTileMap(name: string, mapData: TileMap.MapData) {
        mapData.kind = "tileMap";

        let dataStr = JSON.stringify(mapData);
        let ret = await goCreateFile(name, dataStr, false);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        if (name != this.model.name) {
            this.model.name = name;
            this.model.sendEvent(Evt.fileListShow);
        }

        this.model.postEvent(Evt.tileMapSaveDone);
    }

    closeTileMap() {
        this.model.name = "";
        this.model.currentLayerIndex = 0;
        this.model.mapData = undefined;
        this.model.resetEditInfo();

        this.model.postEvent(Evt.tileMapCloseDone);
    }

    newTileLayer(layer: TileMap.TileLayer) {
        if (!this.model.mapData) {
            this.newTileMap(layer);
            return;
        }

        if (!this.isValidLayer(layer)) {
            popupMsg("param error", "error");
            return;
        }

        if (this.model.layerEdit.has(layer.name)) {
            popupMsg("name duplicate", "error");
            return;
        }

        this.model.addTileLayer(layer);
        this.model.postEvent(Evt.tileLayerUpdate);
    }

    editTileLayer(oldName: string, layer: TileMap.TileLayer) {
        let map = this.model.mapData as TileMap.MapData;
        let editInfo = this.model.layerEdit.get(oldName) as LayerEditInfo;
        let index = editInfo.index;

        if (oldName == layer.name) {
            map.layers[index] = layer;
            this.model.postEvent(Evt.tileLayerUpdate);
            return;
        }

        if (this.model.layerEdit.has(layer.name)) {
            popupMsg("new name duplicate", "error");
            return;
        }

        map.layers[index] = layer;
        this.model.renameEditInfo(oldName, layer.name, editInfo);

        this.model.postEvent(Evt.tileLayerRename, {
            oldName: oldName, newName: layer.name,
            index: index,
        });
    }

    renameTileLayer(oldName: string, newName: string) {
        if (this.model.layerEdit.has(newName)) {
            popupMsg("new name duplicate", "error");
            return;
        }

        let editInfo = this.model.layerEdit.get(oldName) as LayerEditInfo;
        let index = editInfo.index;
        let map = this.model.mapData as TileMap.MapData;
        map.layers[index].name = newName;

        this.model.renameEditInfo(oldName, newName, editInfo);

        this.model.postEvent(Evt.tileLayerRename, {
            oldName: oldName, newName: newName,
            index: index,
        });
    }

    selectTileLayer(index: number) {
        if (this.model.currentLayerIndex == index) {
            return;
        }

        this.model.currentLayerIndex = index;
        this.model.postEvent(Evt.tileLayerUpdate);
    }

    showTileLayer(name: string, visible: boolean) {
        let editInfo = this.model.layerEdit.get(name) as LayerEditInfo;
        let map = this.model.mapData as TileMap.MapData;
        map.layers[editInfo.index].visible = visible;

        this.model.postEvent(Evt.tileLayerUpdate);
    }

    lockTileLayer(name: string, lock: boolean) {
        let editInfo = this.model.layerEdit.get(name) as LayerEditInfo;
        editInfo.lock = lock;
        
        this.model.postEvent(Evt.tileLayerUpdate);
    }

    isLayerLocked(name: string): boolean {
        let editInfo = this.model.layerEdit.get(name) as LayerEditInfo;
        return editInfo.lock;
    }

    delTileLayer(name: string) {
        let editInfo = this.model.layerEdit.get(name) as LayerEditInfo;
        let map = this.model.mapData as TileMap.MapData;
        map.layers.splice(editInfo.index, 1);
        
        this.model.layerEdit.delete(name);
        this.model.reorderEditInfo();

        this.model.postEvent(Evt.tileLayerUpdate);
    }

    reorderTileLayer(orders: Map<string, number>, selectedName: string) {
        let map = this.model.mapData as TileMap.MapData;
        map.layers.sort((a: TileMap.TileLayer, b: TileMap.TileLayer) => {
            let index1 = orders.get(a.name) as number;
            let index2 = orders.get(b.name) as number;
            return index1 - index2;
        });

        this.model.reorderEditInfo();

        let editInfo = this.model.layerEdit.get(selectedName) as LayerEditInfo;
        this.model.currentLayerIndex = editInfo?.index;

        this.model.postEvent(Evt.tileLayerUpdate);
    }

    enableCollisonLayer(enable: boolean): boolean {
        if (!this.model.mapData) {
            return false;
        }

        let map = this.model.mapData as TileMap.MapData;
        map.collision.enable = enable;

        if (enable && !map.collision.isValid()) {
            return false;
        }

        this.model.postEvent(Evt.tileMapEnableCollision);
        return true;
    }

    setCollisionLayer(layerInfo: TileMap.TileLayer, create: boolean) {
        if (!this.model.mapData) {
            return;
        }

        let collision = this.model.mapData.collision;
        collision.name = layerInfo.name;
        collision.x = layerInfo.x;
        collision.y = layerInfo.y;
        collision.width = layerInfo.width;
        collision.height = layerInfo.height;
        collision.tileWidth = layerInfo.tileWidth;
        collision.tileHeight = layerInfo.tileHeight;

        this.model.brush = undefined;

        if (create) {
            this.model.postEvent(Evt.tileMapEnableCollision);
        } else {
            this.model.postEvent(Evt.tileMapUpdateCollision);
        }
    }

    selectCollisionLayer() {
        this.model.currentLayerIndex = -1;
        this.model.postEvent(Evt.tileMapPaintCollision);
    }

    async loadTileSet(name: string) {
        let layer = this.model.getCurrentLayer();
        if (!layer) {
            popupMsg("need layer", "error");
            return;
        }

        let ret = await goSplitMapTiles(name, layer.tileWidth, layer.tileHeight);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        this.model.tileSetName = name;
        let data = ret.Data as SplitMapTilesRet;

        this.model.tileSetPicData = data.data;
        this.model.tileSetInterval = data.interval;

        this.model.postEvent(Evt.tileSetLoadDone);
    }

    setBrush(brush: TileMapBrush) {
        this.model.setBrush(brush);
    }

    async saveTileMapSelect(name: string, tileWidth: number, tileHeight: number, tiles: any[]) {
        let ret = await goSaveTileMapSelect(name, tileWidth, tileHeight, tiles);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        popupMsg("save done", "success");
        this.model.postEvent(Evt.fileListUpdate);
    }

    private isValidLayer(layer: TileMap.TileLayer): boolean {
        if (!layer.name || layer.tileWidth <= 0 || layer.tileHeight <= 0) {
            return false;
        }

        if (layer.alpha < 0) {
            layer.alpha = 0;
        } else if (layer.alpha > 1) {
            layer.alpha = 1;
        }

        layer.visible = true;

        return true;
    }
}