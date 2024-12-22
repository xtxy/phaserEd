import { SceneCtrl } from "../ctrl/scene";
import { SceneEditFrom, SceneNode, SceneNodeDelParam, SceneNodeMoveParam, SceneNodeNewParam, SceneNodeUpdateParam } from "../model/scene";
import { GameScene } from "../scene/game";
import { eventManager, Evt } from "../util/event";
import { Game, Types } from "phaser";
import { SceneNode2GameNode } from "./base";
import { ModelMgr } from "../model/base";
import { FileListModel } from "../model/fileList";
import { Scene as RuntimeScene } from "../runtime/scene";
import { Util } from "../runtime/util";
import { UIScene } from "../scene/ui";

export class SceneView {
    ctrl: SceneCtrl
    game?: Game
    dirty: boolean

    constructor(ctrl: SceneCtrl) {
        this.ctrl = ctrl;
        this.dirty = false;

        eventManager.register(Evt.openProjectDone, this);
        eventManager.register(Evt.sceneShow, this);
        eventManager.register(Evt.sceneNodeNew, this);
        eventManager.register(Evt.sceneNodeUpdate, this);
        eventManager.register(Evt.sceneNodeMove, this);
        eventManager.register(Evt.sceneNodeDel, this);
        eventManager.register(Evt.sceneNodeParse, this);
        eventManager.register(Evt.sceneSaveDone, this);
    }

    processEvent(evt: Evt, param: any): void {
        switch (evt) {
            case Evt.openProjectDone:
                this.ctrl.show();
                break;

            case Evt.sceneShow:
                uiItem("sceneNodePage").show();
                this.showPhaserScene();
                break;

            case Evt.sceneNodeNew:
                this.onNodeNew(param as SceneNodeNewParam);
                break;

            case Evt.sceneNodeMove:
                this.onNodeMove(param as SceneNodeMoveParam);
                break;

            case Evt.sceneNodeDel:
                this.onNodeDel(param as SceneNodeDelParam);
                break;

            case Evt.sceneNodeUpdate:
                this.onNodeUpdate(param as SceneNodeUpdateParam);
                break;

            case Evt.sceneNodeParse:
                this.onNodeParse();
                break;

            case Evt.sceneSaveDone:
                this.onSaveScene();
                break;
        }
    }

    show() {
        this.ctrl.show();
    }

    showPhaserScene() {
        if (this.game) {
            return;
        }

        let scene = new GameScene({key: "game", active: true});
        scene.pointerMoveCallback = this.showPointerPos.bind(this);
        scene.nodePosMoveCallback = this.sceneNodePosMove.bind(this);
        scene.cameraMoveCallback = this.cameraMove.bind(this);

        let uiScene = new UIScene({key: "ui", active: true});
        uiScene.nodePosMoveCallback = this.uiSceneNodePosMove.bind(this);

        const config: Types.Core.GameConfig = {
            type: Phaser.WEBGL,
            parent: gbData.sceneDiv,
            width: 1024,
            height: 768,
            scene: [scene, uiScene],
        };

        this.game = new Game(config);
    }

    sceneDirty() {
        this.dirty = true;

        let sceneName = this.ctrl.model.name;
        if (!sceneName) {
            sceneName = "new scene";
        }

        uiItem("sceneNameLabel").setHTML("<font color='#ff9700'>" + sceneName + " *</font>");
    }

    saveScene() {
        let scene = this.getScene().saveScene();
        let uiScene = this.getUIScene().saveScene();
        if (!scene && !uiScene) {
            popupMsg("scene empty", "error");
            return;
        }

        if (!this.ctrl.model.name) {
            this.saveNewScene(scene, uiScene);
            return;
        }

        this.ctrl.saveScene(this.ctrl.model.name, scene, uiScene);
    }

    loadScene() {
        let item = uiItem("fileList").getSelectedItem();
        if (!item) {
            return;
        }

        if (!item.Name.endsWith(".json")) {
            popupMsg("scene type error", "error");
            return;
        }

        let fileListModel = ModelMgr.get(FileListModel);
        let name = fileListModel.currentDir + "/" + item.Name;
        if (this.dirty) {
            uiConfirm({
                title: "Load Scene",
                text: "Discard current scene change?",
                ok: "Yes",
                cancel: "No",
            }).then(() => {
                this.tryLoadScene(name);
            });
        } else {
            this.tryLoadScene(name);
        }
    }

    nodeTreeChange(id: string) {
        this.ctrl.model.uiActive = id == "uiSceneNode";
        this.getUIScene().setActive(this.ctrl.model.uiActive);
        this.getScene().setActive(!this.ctrl.model.uiActive);
    }

    private saveNewScene(scene: any, uiScene: any) {
        uiPrompt({
            title: "Save Scene",
            text: "Save scene to current folder",
            ok: "Ok",
            cancel: "Cancel",
            input: {
                required: true,
                value: "",
                placeholder: "scene name",
            }
        }).then((name: string) => {
            if (!name.endsWith(".json")) {
                name += ".json"
            }

            name = ModelMgr.get(FileListModel).currentDir + "/" + name;
            this.ctrl.saveScene(name, scene, uiScene);
        });
    }

    private tryLoadScene(name: string) {
        uiConfirm({
            title: "Load Scene",
            text: "Load " + name + "?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            this.ctrl.loadScene(name);
        });
    }

    private onNodeNew(param: SceneNodeNewParam) {
        let gameNode = SceneNode2GameNode(param.node);

        if (this.ctrl.model.uiActive) {
            this.getUIScene().addNode(param.parentPath, gameNode);
        } else {
            this.getScene().addNode(param.parentPath, gameNode);
        } 
        
        this.sceneDirty();
    }

    private onNodeMove(param: SceneNodeMoveParam) {
        if (this.ctrl.model.uiActive) {
            this.getUIScene().moveNode(param.oldPath, param.newParentPath);
        } else {
            this.getScene().moveNode(param.oldPath, param.newParentPath);
        }

        this.sceneDirty();
    }

    private onNodeDel(param: SceneNodeDelParam) {
        if (this.ctrl.model.uiActive) {
            this.getUIScene().delNode(param.path);
        } else {
            this.getScene().delNode(param.path);
        }

        this.sceneDirty();
    }

    private onNodeUpdate(param: SceneNodeUpdateParam) {
        if (param.from == SceneEditFrom.GameScene || param.from == SceneEditFrom.UIScene) {
            return;
        }

        let gameNode = SceneNode2GameNode(param.node);

        if (this.ctrl.model.uiActive) {
            this.getUIScene().updateNode(param.path, gameNode);
        } else {
            this.getScene().updateNode(param.path, gameNode);
        }
        
        this.sceneDirty();
    }

    private async onNodeParse() {
        await Util.treeNodeEachByBreath(this.ctrl.model.children, async (parentPath: number[], node: any) => {
            let gameNode = SceneNode2GameNode(node as SceneNode);
            await this.getScene().addNode(parentPath, gameNode);
            return true;
        }, "children");

        await Util.treeNodeEachByBreath(this.ctrl.model.uiChildren, async (parentPath: number[], node: any) => {
            let gameNode = SceneNode2GameNode(node as SceneNode);
            await this.getUIScene().addNode(parentPath, gameNode);
            return true;
        }, "children");
    }

    private onSaveScene() {
        this.dirty = false;
        uiItem("tileMapNameLabel").setHTML("<font color='#000000'>" + this.ctrl.model.name + "</font>");;
    }

    showPointerPos(x: number, y: number) {
        uiItem("scenePointerPos").setValue("x: " + x + ", y: " + y);
    }

    sceneNodePosMove(path: number[], sceneNode: RuntimeScene.Node) {
        this.ctrl.nodePosMove(path, SceneEditFrom.GameScene);
    }

    uiSceneNodePosMove(path: number[], sceneNode: RuntimeScene.Node) {
        this.ctrl.nodePosMove(path, SceneEditFrom.UIScene);
    }

    cameraMove(x: number, y: number) {
        this.ctrl.setSceneCenter(x, y);
    }

    private getScene(): GameScene {
        let game = this.game as Game;
        return game.scene.getAt(0) as GameScene;
    }

    private getUIScene() : UIScene {
        let game = this.game  as Game;
        return game.scene.getAt(1) as UIScene;
    }
}