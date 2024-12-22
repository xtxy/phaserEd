import { Game } from "phaser";
import { TileMapCtrl } from "../ctrl/tileMap";
import { Evt, eventManager } from "../util/event";
import { TileSetScene } from "../scene/tileSet";
import { TileMap } from "../runtime/tileMap";
import { TileMapBrush, TileMapBrushTile } from "../model/tileMap";

export class TileSetView {
    ctrl: TileMapCtrl
    game?: Game
    tileWidth: number
    tileHeight: number

    constructor(ctrl: TileMapCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.tileMapEditShow, this);
        eventManager.register(Evt.tileSetLoadDone, this);
        eventManager.register(Evt.tileMapCreateBrushByTileSet, this);
        eventManager.register(Evt.tileMapPaintCollision, this);
    }

    processEvent(evt: Evt, param: any) {
        switch (evt) {
            case Evt.tileMapEditShow:
                this.onShow();
                break;

            case Evt.tileSetLoadDone:
                this.onloadTileSetDone();
                break;

            case Evt.tileMapCreateBrushByTileSet:
                this.onCreateBrushByTileSet();
                break;

            case Evt.tileMapPaintCollision:
                this.onPaintCollision();
                break;
        }
    }

    clearSelects() {
        this.getScene().clearSelects(true)
    }

    private onShow() {
        if (this.game) {
            return;
        }

        let sceneObj = new TileSetScene();

        let config = {
            type: Phaser.WEBGL,
            parent: gbData.tileSetDiv,
            width: 380,
            height: 380,
            scene: sceneObj,
        };
        this.game = new Phaser.Game(config);
    }

    private onloadTileSetDone() {
        let layer = this.ctrl.model.getCurrentLayer() as TileMap.TileLayer;
        this.getScene().loadMapPic(this.ctrl.model.tileSetPicData,
            this.ctrl.model.tileSetInterval,
            layer.tileWidth, layer.tileHeight);

        this.tileWidth = layer.tileWidth;
        this.tileHeight = layer.tileHeight;
    }


    private onCreateBrushByTileSet() {
        let brushTiles = this.getScene().getSelects();
        let brush = new TileMapBrush(uiItem("tileSetMode").getValue(),
            this.ctrl.model.tileSetName, this.tileWidth, this.tileHeight, 1,
            brushTiles,
        );
        this.ctrl.setBrush(brush);
    }

    private onPaintCollision() {
        this.getScene().clearSelects(true);
    }

    private getScene(): TileSetScene {
        let game = this.game as Game;
        return game.scene.getAt(0) as TileSetScene;
    }
}