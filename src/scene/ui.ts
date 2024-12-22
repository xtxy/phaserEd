import { Scene, Input } from "phaser";
import { SceneHelper, GameNode } from "./scene";
import { Util } from "../runtime/util";
import { Scene as RuntimeScene } from "../runtime/scene";
import { UI } from "../runtime/ui";

export class UIScene extends Scene {
    private helper: SceneHelper
    private leftButtonDown: boolean

    nodePosMoveCallback: (path: number[], sceneNode: RuntimeScene.Node) => void;
    sceneDirtyCallback?: () => void;

    create() {
        this.helper = new SceneHelper(this);

        this.input.on('pointerdown', (pointer: Input.Pointer) => {
            if (!this.helper.handleMouse) {
                return;
            }

            this.leftButtonDown = pointer.leftButtonDown();
            if (this.leftButtonDown) {
                this.helper.checkClickObj(pointer);
            }
        });

        this.input.on('pointermove', (pointer: Input.Pointer) => {
            if (!this.helper.handleMouse) {
                return;
            }

            if (pointer.isDown && this.leftButtonDown) {
                this.cameras.main.getWorldPoint(pointer.x, pointer.y, this.helper.worldPoint);
                let sceneNode = this.helper.clickObjMove();
                if (sceneNode) {
                    this.nodePosMoveCallback(this.helper.sceneNodeTree.getNodePath(sceneNode), sceneNode);
                }
            }
        });
    }

    async addNode(parentPath: number[] | null, node: GameNode) {
        console.log("ui scene add node:", parentPath, node.actor.kind);

        switch (node.actor.kind) {
            case "button":
                await this.addButton(parentPath, node);
                break;
        }

        if (this.sceneDirtyCallback) {
            this.sceneDirtyCallback();
        }
    }

    updateNode(path: number[], node: GameNode): RuntimeScene.Node | null {
        let uiLayout = node.uiLayout as UI.Layout;
        uiLayout.getTransform(this, node.transform.pos);

        return this.helper.updateNode(path, node);
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

    private async addButton(parentPath: number[] | null, node: GameNode) {
        if (!node.uiLayout) {
            return;
        }

        let fileName = node.actor.file as string;
        await this.addPic(fileName);

        let gameNode = this.add.image(0, 0, fileName);
        gameNode.name = node.name;
        gameNode.setInteractive();

        let data = new Map<string, any>();
        data.set("file", node.file);

        data.set("uiLayout", node.uiLayout);
        node.uiLayout.getTransform(this, node.transform.pos);

        console.log("button pos:", node.transform.pos.x, node.transform.pos.y);

        let config: RuntimeScene.NodeConfig = {
            id: Util.getUuid(),
            name: node.name,
            kind: "button",
            transform: node.transform,
            data: data,
            gameNode: gameNode,
        };

        this.helper.sceneNodeTree.addNode(parentPath, config);
    }

    private async addPic(fileName: string) {
        if (this.textures.exists(fileName)) {
            return;
        }

        let ret = await goLoadImage(fileName);
        if (ret.Error) {
            popupMsg("load sprite error:" + ret.Error, "error");
            return;
        }

        let pic = await Util.loadImage(ret.Data as string);
        this.textures.addImage(fileName, pic);
    }
}