import { TileMapCtrl } from "../ctrl/tileMap";
import { Evt, eventManager } from "../util/event";
import { ModelMgr } from "../model/base";
import { FileListModel } from "../model/fileList";
import { TileMap } from "../runtime/tileMap";
import { TileLayerRenameParam } from "../model/tileMap";

const new_tile_map_window = "newTileMapWindow";
const edit_layer_window = "editLayerWindow";
const new_tile_layer_window = "newTileLayerWindow";
const new_collision_layer_window = "newCollisionLayerWindow";
const edit_collision_layer_window = "editCollisionLayerWindow";

class EditLayer {
    name: string
    tileWidth: number
    tileHeight: number
    alpha: number
    visible: boolean
    lock: boolean
}

export class TileMapEditView {
    ctrl: TileMapCtrl
    tileLayerWindowId: any
    editTileLayerName: string

    constructor(ctrl: TileMapCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.tileMapShow, this);
        eventManager.register(Evt.tileMapNew, this);
        eventManager.register(Evt.tileMapLoadDone, this);
        eventManager.register(Evt.tileMapCloseDone, this);
        eventManager.register(Evt.tileLayerUpdate, this);
        eventManager.register(Evt.tileLayerRename, this);
        eventManager.register(Evt.tileMapEnableCollision, this);
        eventManager.register(Evt.tileMapPaintCollision, this);
        eventManager.register(Evt.tileMapShowCollision, this);
    }

    processEvent(evt: Evt, param: any) {
        switch (evt) {
            case Evt.tileMapShow:
                this.onShow();
                break;

            case Evt.tileMapLoadDone:
                this.onLoadMapDone();
                break;

            case Evt.tileMapCloseDone:
                this.onCloseMap();
                break;

            case Evt.tileMapNew:
                this.onNewMap();
                break;

            case Evt.tileLayerUpdate:
                this.onUpdateLayer();
                break;

            case Evt.tileLayerRename:
                this.onRenameLayer(param as TileLayerRenameParam);
                break;

            case Evt.tileMapEnableCollision:
                this.onEnableCollision();
                break;

            case Evt.tileMapPaintCollision:
                this.onPaintCollision();
                break;

            case Evt.tileMapShowCollision:
                this.onShowCollision(param as boolean);
                break;
        }
    }

    newTileMap() {
        this.popupTileLayerEditor(new_tile_map_window, "New TileMap");
    }

    loadTileSet() {
        let item = uiItem("fileList").getSelectedItem();
        if (!item) {
            return;
        }

        if (!item.Name.endsWith(".png")) {
            popupMsg("tile set pic type error", "error");
            return;
        }

        let fileListModel = ModelMgr.get(FileListModel);
        this.ctrl.loadTileSet(fileListModel.currentDir + "/" + item.Name);
    }

    enableCollisonLayer(enable: boolean) {
        if (!this.ctrl.model.mapData) {
            return;
        }

        if (this.ctrl.enableCollisonLayer(enable)) {
            return;
        }

        this.popupTileLayerEditor(new_collision_layer_window, "New Collision Layer");
        uiItem("tileLayerName").setValue("collisionLayer");

        let tileWidth = this.ctrl.model.mapData.layers[0].tileWidth;
        let tileHeight = this.ctrl.model.mapData.layers[0].tileHeight;

        uiItem("tileLayerTileWidth").setValue(tileWidth);
        uiItem("tileLayerTileHeight").setValue(tileHeight);
        uiItem("tileLayerTileSquareCheck").setValue(tileWidth == tileHeight ? 0 : 1);
        uiItem("tileLayerAlpha").setValue(0.5);
        uiItem("tileLayerAlpha").disable();
    }

    startPaintCollision() {
        this.ctrl.selectCollisionLayer();
    }

    addTileLayer() {
        this.popupTileLayerEditor(new_tile_layer_window, "New TileLayer");

        let currentLayer = this.ctrl.model.getCurrentLayer();
        if (!currentLayer) {
            return;
        }

        uiItem("tileLayerTileWidth").setValue(currentLayer.tileWidth);
        uiItem("tileLayerTileHeight").setValue(currentLayer.tileHeight);
        uiItem("tileLayerTileSquareCheck").setValue(currentLayer.tileWidth == currentLayer.tileHeight ? 0 : 1);
        uiItem("tileLayerAlpha").setValue(1);
        uiItem("tileLayerAlpha").enable();
    }

    delTileLayer() {
        let item = uiItem("tileMapLayers").getSelectedItem();
        if (!item) {
            return;
        }

        uiConfirm({
            title: "Delete Tile Layer",
            text: "Delete " + item.name + " ?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            this.ctrl.delTileLayer(item.name as string);
        });
    }

    selectTileLayer(id: any) {
        let index = uiItem("tileMapLayers").getIndexById(id) as number;
        this.ctrl.selectTileLayer(index);
    }

    reorderTileLayer() {
        let orderMap = new Map<string, number>();
        let index = 0;
        uiItem("tileMapLayers").eachRow((row: any) => {
            let item = uiItem("tileMapLayers").getItem(row);
            orderMap.set(item.name as string, index);
            index++;
        });

        let selectedItem = uiItem("tileMapLayers").getSelectedItem();
        this.ctrl.reorderTileLayer(orderMap, selectedItem.name as string);
    }

    editTileLayer(item: any) {
        this.popupTileLayerEditor(edit_layer_window, "Edit TileLayer");
        uiItem("tileLayerName").setValue(item.name);
        uiItem("tileLayerTileWidth").setValue(item.tileWidth);
        uiItem("tileLayerTileHeight").setValue(item.tileHeight);

        uiItem("tileLayerTileWidth").disable();
        uiItem("tileLayerTileHeight").disable();
        uiItem("tileLayerTileSquareCheck").disable();

        uiItem("tileLayerAlpha").setValue(item.alpha);

        this.editTileLayerName = item.name as string;
    }

    editCollisionLayer() {
        let collision = this.ctrl.model.mapData?.collision;
        if (!collision || !collision.enable) {
            return;
        }

        this.popupTileLayerEditor(edit_collision_layer_window, "Edit Collision");
        uiItem("tileLayerName").setValue(collision.name);
        uiItem("tileLayerTileWidth").setValue(collision.tileWidth);
        uiItem("tileLayerTileHeight").setValue(collision.tileHeight);

        uiItem("tileLayerTileWidth").enable();
        uiItem("tileLayerTileSquareCheck").enable();

        if (collision.tileWidth == collision.tileHeight) {
            uiItem("tileLayerTileSquareCheck").setValue(0);
            uiItem("tileLayerTileHeight").disable();
        } else {
            uiItem("tileLayerTileSquareCheck").setValue(1);
            uiItem("tileLayerTileHeight").enable();
        }

        uiItem("tileLayerAlpha").setValue(0.5);
        uiItem("tileLayerAlpha").disable();
    }

    tileLayerWindowDone(ok: boolean) {
        if (!ok) {
            uiItem(this.tileLayerWindowId).close();
            return;
        }

        let layerName = uiItem("tileLayerName").getValue();
        let tileWidth = parseInt(uiItem("tileLayerTileWidth").getValue());
        let tileHeight = parseInt(uiItem("tileLayerTileHeight").getValue());

        let alpha = parseFloat(uiItem("tileLayerAlpha").getValue());

        if (!layerName || Number.isNaN(tileWidth) || Number.isNaN(tileHeight) ||
            Number.isNaN(alpha)) {
            popupMsg("param error", "error");
            return;
        }

        uiItem(this.tileLayerWindowId).close();

        let layerInfo = new TileMap.TileLayer({
            name: layerName, tileWidth: tileWidth, tileHeight: tileHeight,
            x: 0, y: 0, width: 0, height: 0, alpha: alpha,
            visible: true,
        });

        switch (this.tileLayerWindowId) {
            case new_tile_map_window:
                {
                    this.ctrl.newTileMap(layerInfo);
                }
                break;

            case edit_layer_window:
                {
                    this.ctrl.editTileLayer(this.editTileLayerName, layerInfo);
                }
                break;

            case new_tile_layer_window:
                {
                    this.ctrl.newTileLayer(layerInfo);
                }
                break;

            case new_collision_layer_window:
                this.ctrl.setCollisionLayer(layerInfo, true);
                break;

            case edit_collision_layer_window:
                this.ctrl.setCollisionLayer(layerInfo, false);
        }
    }

    showTileLayer(name: string) {
        this.ctrl.showTileLayer(name, true);
    }

    hideTileLayer(name: string) {
        this.ctrl.showTileLayer(name, false);
    }

    lockTileLayer(name: string) {
        this.ctrl.lockTileLayer(name, true);
    }

    unlockTileLayer(name: string) {
        this.ctrl.lockTileLayer(name, false);
    }

    private onShow() {
        uiItem("tileMapEditPage").show();
        this.ctrl.showEdit();
    }

    private onNewMap() {
        this.parseLayers();

        uiItem("tileMapCollisionCheckBox").enable();
        uiItem("tileMapCollisionCheckBox").setValue(0);
    }

    private onLoadMapDone() {
        this.parseLayers();

        uiItem("tileMapCollisionCheckBox").enable();

        let mapData = this.ctrl.model.mapData as TileMap.MapData;
        if (mapData.collision.enable) {
            uiItem("tileMapCollisionCheckBox").setValue(1);
        } else {
            uiItem("tileMapCollisionCheckBox").setValue(0);
        }
    }

    private onUpdateLayer() {
        this.parseLayers();

        uiItem("tileMapCollisionPaintingIcon").setHTML('<i></i>');
    }

    private onCloseMap() {
        uiItem("tileMapLayers").clearAll();

        uiItem("tileMapCollisionCheckBox").setValue(0)
        uiItem("tileMapCollisionCheckBox").disable();
    }

    private onRenameLayer(param: TileLayerRenameParam) {
        this.selectCurrentLayer();
        let item = uiItem("tileMapLayers").getSelectedItem();
        item.name = param.newName;

        if (param.index >= 0) {
            let mapData = this.ctrl.model.mapData as TileMap.MapData;
            let layer = mapData.layers[param.index];

            item.alpah = layer.alpha;
        }

        uiItem("tileMapLayers").updateItem(item.id, item);
    }

    private onEnableCollision() {
        if (this.ctrl.model.mapData?.collision.enable) {
            uiItem("tileMapCollisionPaintBtn").enable();
            uiItem("tileMapCollisionVisibleBtn").enable();
            uiItem("tileMapCollisionEditBtn").enable();
        } else {
            uiItem("tileMapCollisionPaintBtn").disable();
            uiItem("tileMapCollisionVisibleBtn").disable();
            uiItem("tileMapCollisionEditBtn").disable();
        }
    }

    private onPaintCollision() {
        uiItem("tileMapLayers").unselectAll();
        uiItem("tileMapCollisionPaintingIcon").setHTML('<i class="fa-solid fa-paintbrush"></i>');
    }

    private onShowCollision(visible: boolean) {
        if (visible) {
            uiItem("tileMapCollisionVisibleBtn").setHTML('<i class="fa-solid fa-eye"></i>');
        } else {
            uiItem("tileMapCollisionVisibleBtn").setHTML('<i class="fa-solid fa-eye-slash"></i>');
        }
    }

    private getEditLayer(layer: TileMap.TileLayer): EditLayer {
        let item = new EditLayer();
        item.name = layer.name;
        item.alpha = layer.alpha;
        item.visible = layer.visible;
        item.tileWidth = layer.tileWidth;
        item.tileHeight = layer.tileHeight;

        let info = this.ctrl.model.layerEdit.get(layer.name);
        if (info) {
            item.lock = info.lock;
        }

        return item;
    }

    private parseLayers() {
        uiItem("tileMapLayers").clearAll();

        if (!this.ctrl.model.mapData) {
            return;
        }

        let editLayers: EditLayer[] = [];
        let layers = this.ctrl.model.mapData.layers;
        for (let i = 0; i < layers.length; ++i) {
            let layer = this.getEditLayer(layers[i]);
            editLayers.push(layer);
        }

        uiItem("tileMapLayers").parse(editLayers);
        this.selectCurrentLayer();
    }

    private selectCurrentLayer() {
        let index = this.ctrl.model.currentLayerIndex;
        let id = uiItem("tileMapLayers").getIdByIndex(index);
        if (!id) {
            return;
        }

        uiItem("tileMapLayers").select(id);
    }

    private popupTileLayerEditor(windowId: any, head: string) {
        this.tileLayerWindowId = windowId;
        popupTileLayerEditor(windowId, head);
    }
}