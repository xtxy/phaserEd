import { Input, Tilemaps, Types, Geom, Scene } from "phaser";
import { Scene as RuntimeScene } from "../runtime/scene";
import { SceneHelper, GameNode } from "./scene";
import { TileMap } from "../runtime/tileMap";
import { Util } from "../runtime/util";
import { SceneUtil } from "./util";

export class GameScene extends Scene {
    private helper: SceneHelper
    private cameraMoving: boolean
    private downX: number
    private downY: number
    private cameraX: number
    private cameraY: number
    private tileMapLoader: TileMap.Loader
    private cameraRect: Geom.Rectangle

    nodePosMoveCallback: (path: number[], sceneNode: RuntimeScene.Node) => void;
    pointerMoveCallback?: (x: number, y: number) => void;
    cameraMoveCallback?: (x: number, y: number) => void;

    create() {
        this.helper = new SceneHelper(this);
        this.helper.handleMouse = true;

        this.input.mouse?.disableContextMenu();
        this.input.dragDistanceThreshold = 4;

        this.input.on('pointerdown', (pointer: Input.Pointer) => {
            if (!this.helper.handleMouse) {
                return;
            }

            let camera = this.cameras.main;

            if (pointer.rightButtonDown()) {
                this.cameraMoving = true;

                this.downX = pointer.x;
                this.downY = pointer.y;
                this.cameraX = camera.scrollX;
                this.cameraY = camera.scrollY;
            } else {
                this.cameraMoving = false;
                this.helper.checkClickObj(pointer);
            }
        });

        this.input.on('pointermove', (pointer: Input.Pointer) => {
            if (!this.helper.handleMouse) {
                return;
            }

            let camera = this.cameras.main;
            let x = pointer.x;
            let y = pointer.y;

            camera.getWorldPoint(x, y, this.helper.worldPoint);

            if (pointer.isDown) {
                if (this.cameraMoving) {
                    let newX = this.cameraX + this.downX - x;
                    let newY = this.cameraY + this.downY - y;
                    camera.setScroll(newX, newY);

                    this.setCameraPos();
                } else {
                    let sceneNode = this.helper.clickObjMove();
                    if (sceneNode) {
                        this.nodePosMoveCallback(this.helper.sceneNodeTree.getNodePath(sceneNode), sceneNode);
                    }
                }
            }

            if (this.pointerMoveCallback) {
                this.pointerMoveCallback(this.helper.worldPoint.x, this.helper.worldPoint.y);
            }
        });
    }

    scaleScene(value: number) {
        this.cameras.main.zoom = value;
    }

    async addNode(parentPath: number[] | null, node: GameNode) {
        console.log("scene add node:", parentPath, node.actor.kind);

        switch (node.actor.kind) {
            case "tileMap":
                await this.addTileMap(parentPath, node);
                break;

            case "sprite":
                await this.addSprite(parentPath, node);
                break;
        }
    }

    updateNode(path: number[], node: GameNode): RuntimeScene.Node | null {
        let sceneNode = this.helper.updateNode(path, node);
        if (!sceneNode) {
            return null;
        }

        if (sceneNode.kind == "tileMap") {
            this.setTileMapTransform(sceneNode);
        }

        return sceneNode;
    }

    moveNode(oldPath: number[], newParentPath: number[] | null) {
        this.helper.moveNode(oldPath, newParentPath);
    }

    delNode(path: number[]) {
        this.helper.delNode(path);
    }

    saveScene(): any {
        return this.helper.saveScene();
    }

    setActive(active: boolean) {
        this.helper.handleMouse = active;
    }

    private async addTileMap(parentPath: number[] | null, node: GameNode) {
        if (!this.tileMapLoader) {
            this.tileMapLoader = new TileMap.Loader();
        }

        let mapData = new TileMap.MapData(node.actor);
        await SceneUtil.checkMapTexture(this, mapData);

        let maps = this.tileMapLoader.load(this, mapData);
        if (!maps) {
            popupMsg("load map error");
            return;
        }

        let data = new Map<string, any>();
        data.set("file", node.file);

        let config: RuntimeScene.NodeConfig = {
            id: Util.getUuid(),
            name: node.name,
            kind: "tileMap",
            transform: node.transform,
            data: data,
            gameNode: maps[0],
        };

        let sceneNode = this.helper.sceneNodeTree.addNode(parentPath, config);
        this.setTileMapTransform(sceneNode);
    }

    private setTileMapTransform(sceneNode: RuntimeScene.Node) {
        let worldScale = sceneNode.worldScale();
        let worldAngle = sceneNode.worldAngle();

        let tileMap = sceneNode.gameNode as Tilemaps.Tilemap

        for (let i = 0; i < tileMap.layers.length; i++) {
            let layerData = tileMap.layers[i];
            let mapLayer = layerData.tilemapLayer;

            let worldPos = sceneNode.local2World(layerData.x, layerData.y);
            mapLayer.x = worldPos[0];
            mapLayer.y = worldPos[1];
            mapLayer.depth = layerData.tilemapLayer.depth + sceneNode.transform.pos.z;

            mapLayer.scaleX = worldScale.x;
            mapLayer.scaleY = worldScale.y;

            mapLayer.angle = worldAngle;
        }
    }

    private async addSprite(parentPath: number[] | null, node: GameNode) {
        let fileName = node.actor.file as string;
        let idleIndex = node.actor.idleIndex as number;
        await this.addSpriteSheet(fileName, node.actor as Types.Textures.SpriteSheetConfig);

        let gameNode = this.add.image(0, 0, fileName, idleIndex);
        gameNode.name = node.name;
        gameNode.setInteractive();

        let data = new Map<string, any>();
        data.set("file", node.file);

        let config: RuntimeScene.NodeConfig = {
            id: Util.getUuid(),
            name: node.name,
            kind: "sprite",
            transform: node.transform,
            data: data,
            gameNode: gameNode,
        };

        this.helper.sceneNodeTree.addNode(parentPath, config);
    }

    private async addSpriteSheet(fileName: string, config: Types.Textures.SpriteSheetConfig) {
        if (this.textures.exists(fileName)) {
            return;
        }

        let ret = await goLoadImage(fileName);
        if (ret.Error) {
            popupMsg("load sprite error:" + ret.Error, "error");
            return;
        }

        let pic = await Util.loadImage(ret.Data as string);
        this.textures.addSpriteSheet(fileName, pic, config);
    }

    private setCameraPos() {
        let rect = this.cameras.main.worldView;
        if (rect.width == 0 || rect.height == 0) {
            return;
        }

        this.cameraRect = rect;
        if (this.cameraMoveCallback) {
            this.cameraMoveCallback(this.cameraRect.x + this.cameraRect.width / 2, this.cameraRect.y + this.cameraRect.height / 2);
        }
    }

    update(time: number, delta: number): void {
        if (!this.cameraRect) {
            this.setCameraPos();
        }
    }
}