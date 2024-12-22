import { SceneEditFrom, SceneModel, SceneNode } from "../model/scene";
import { Scene } from "../runtime/scene";
import { TileMap } from "../runtime/tileMap";
import { Evt } from "../util/event";
import { getPathBase } from "../util/util";
import { Util } from "../runtime/util";
import { UI } from "../runtime/ui";
import { Script } from "../runtime/script";

export class SceneCtrl {
    model: SceneModel

    constructor(model: SceneModel) {
        this.model = model;
    }

    show() {
        this.model.postEvent(Evt.sceneShow);
    }

    newScene() {
        this.model.postEvent(Evt.sceneNew);
    }

    async saveScene(name: string, data: any, uiData: any) {
        let scene = {
            kind: "scene",
            nodes: data,
            uiNodes: uiData,
        };

        let dataStr = JSON.stringify(scene);
        let ret = await goCreateFile(name, dataStr, false);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        if (name != this.model.name) {
            this.model.name = name;
            this.model.sendEvent(Evt.fileListShow);
        }

        this.model.postEvent(Evt.sceneSaveDone);
    }

    async loadScene(name: string) {
        let ret = await goReadFile(name, false);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        let sceneData = JSON.parse(ret.Data);
        if (!sceneData) {
            popupMsg("json decode error", "error");
            return;
        }

        if (sceneData.kind != "scene") {
            popupMsg("file kind error", "error");
            return;
        }

        this.model.children = [];

        if (sceneData.nodes) {
            await Util.treeNodeEachByBreath(sceneData.nodes, async (parentPath: number[], node: any) => {
                console.log("node:", node);
                let sceneNode = await this.parseSceneNode(node);
                if (sceneNode) {
                    this.model.addNode(parentPath, sceneNode, false);
                }

                return true;
            }, "children");
        }

        if (sceneData.uiNodes) {
            this.model.uiActive = true;

            await Util.treeNodeEachByBreath(sceneData.uiNodes, async (parentPath: number[], node: any) => {
                console.log("ui node:", node);
                let sceneNode = await this.parseSceneNode(node);
                console.log("scene ui node:", sceneNode);
                if (sceneNode) {
                    this.model.addNode(parentPath, sceneNode, false);
                }

                return true;
            }, "children");

            this.model.uiActive = false;
        }

        console.log("node num:", this.model.children.length, "ui node num:", this.model.uiChildren.length);

        this.model.postEvent(Evt.sceneNodeParse);
    }

    async addNodeFromFile(name: string, parentPath: number[] | null) {
        let info = {
            name: getPathBase(name),
            data: { file: name },
        };
        let node = await this.parseSceneNode(info);
        if (!node) {
            return;
        }

        let transform = new Scene.Transform();

        if (node.actor.kind == "tileMap") {
            let mapData = new TileMap.MapData(node.actor);
            let center = mapData.getCenterPoint();
            transform.pos.x = this.model.center.x - center.x;
            transform.pos.y = this.model.center.y - center.y;
        } else {
            transform.pos.x = this.model.center.x;
            transform.pos.y = this.model.center.y;
        }

        node.transform = transform;

        if (this.model.uiActive) {
            if (!node.actor.uiLayout) {
                popupMsg("try drag game obj to ui", "error");
                return;
            }

            node.uiLayout = new UI.Layout(node.actor.uiLayout);
        } else if (node.actor.uiLayout) {
            popupMsg("try drag ui obj to game", "error");
            return;
        }

        this.model.addNode(parentPath, node);
    }

    moveNode(oldPath: number[], newParentPath: number[] | null) {
        this.model.moveNode(oldPath, newParentPath);
    }

    delNode(path: number[]) {
        this.model.delNode(path);
    }

    findNodeByPath(path: number[]): SceneNode | null {
        return this.model.findNodeByPath(path);
    }

    selectNode(path: number[]) {
        this.clearSelect(this.model.getNodeRoot());
        let node = this.model.findNodeByPath(path);
        if (!node) {
            return;
        }

        node.select = true;
        this.model.postEvent(Evt.sceneNodeSelect, { node: node });
    }

    clearSelect(children: SceneNode[]) {
        for (let i = 0; i < children.length; ++i) {
            children[i].select = false;
            this.clearSelect(children[i].children);
        }
    }

    getSelectedNode() {
        return this.findNode((node: SceneNode): boolean => {
            return node.select;
        });
    }

    updateSelectedNode() {
        let ret = this.getSelectedNode();
        if (!ret) {
            return;
        }

        this.model.postEvent(Evt.sceneNodeUpdate, ret);
    }

    findNode(checkFunc: (node: SceneNode) => boolean) {
        let root = this.model.getNodeRoot();
        let ret = this.findNodeInArr(root, "", checkFunc);
        if (!ret) {
            return null;
        }

        let pathStrArr = ret.path.substring(1).split("|");
        let path: number[] = [];
        for (let i = 0; i < pathStrArr.length; ++i) {
            path.push(parseInt(pathStrArr[i]));
        }

        return {
            node: ret.node,
            path: path,
        };
    }

    nodePosMove(path: number[], from: SceneEditFrom) {
        let node = this.model.findNodeByPath(path);
        if (!node) {
            return;
        }

        this.model.postEvent(Evt.sceneNodeUpdate, { node: node, path: path, from: from });
    }

    modifySelectedNode(key: string, value: number | string) {
        let ret = this.getSelectedNode();
        if (!ret) {
            return;
        }

        let node = ret.node as SceneNode;
        switch (key) {
            case "posX":
                node.transform.pos.x = value as number;
                break;

            case "posY":
                node.transform.pos.y = value as number;
                break;

            case "posZ":
                node.transform.pos.z = value as number;
                break;

            case "scaleX":
                node.transform.scale.x = value as number;
                break;

            case "scaleY":
                node.transform.scale.y = value as number;
                break;

            case "angle":
                node.transform.angle = value as number;
                break;

            case "uiLayoutAnchor":
                node.uiLayout?.setAnchorByString(value as string);
                break;

            case "uiLayoutOffsetKind":
                node.uiLayout?.setOffsetKindByString(value as string);
                break;

            case "uiLayoutOffsetX":
                if (node.uiLayout) {
                    node.uiLayout.offset.x = value as number;
                }
                break;

            case "uiLayoutOffsetY":
                if (node.uiLayout) {
                    node.uiLayout.offset.y = value as number;
                }
                break;
        }

        this.model.postEvent(Evt.sceneNodeUpdate, ret);
    }

    setSceneCenter(x: number, y: number) {
        this.model.center.x = Math.round(x);
        this.model.center.y = Math.round(y);
    }

    // async addScript4Node(name: string) {
    //     let ret = this.getSelectedNode();
    //     if (!ret) {
    //         return;
    //     }

    //     let fileData = await goReadFile(name, false);
    //     if (fileData.Error) {
    //         popupMsg(fileData.Error, "error");
    //         return;
    //     }

    //     let info = Script.parseCode(fileData.Data, "Actor");
    //     if (!info) {
    //         popupMsg("parse code error", "error");
    //         return;
    //     }

    //     console.log("class info:", info.name, info.properties);

    //     info.file = name;

    //     if (!ret.node.scripts) {
    //         ret.node.scripts = [info];
    //     } else {
    //         ret.node.scripts.push(info);
    //     }

    //     this.model.postEvent(Evt.sceneNodeUpdate, ret);
    // }

    // delScript4Node(index: number) {
    //     let ret = this.getSelectedNode();
    //     if (!ret) {
    //         return;
    //     }

    //     if (!ret.node.scripts || ret.node.scripts.length <= index) {
    //         popupMsg("index error", "error");
    //         return;
    //     }

    //     ret.node.scripts.splice(index, 1);
    //     this.model.postEvent(Evt.sceneNodeUpdate, ret);
    // }

    // editScript4Node(index: number, name: string, value: string) {
    //     let ret = this.getSelectedNode();
    //     if (!ret) {
    //         return;
    //     }

    //     if (!ret.node.scripts || ret.node.scripts.length <= index) {
    //         popupMsg("index error", "error");
    //         return;
    //     }

    //     for (let prop of ret.node.scripts[index].properties) {
    //         if (prop.name == name) {
    //             prop.value = value;
    //             break;
    //         }
    //     }

    //     this.model.postEvent(Evt.sceneNodeUpdate, ret);
    // }

    private findNodeInArr(children: SceneNode[], pathStr: string, checkFunc: (node: SceneNode) => boolean): { node: SceneNode, path: string } | null {
        if (!children || children.length == 0) {
            return null;
        }

        for (let i = 0; i < children.length; ++i) {
            let node = children[i];
            let path = pathStr + "|" + i;
            if (checkFunc(node)) {
                return { node: node, path: path };
            }

            let ret = this.findNodeInArr(node.children, path, checkFunc);
            if (ret) {
                return ret;
            }
        }

        return null;
    }

    private async parseSceneNode(info: any): Promise<SceneNode | null> {
        let fileName = info.data.file;
        let ret = await goReadFile(fileName, false);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return null;
        }

        let actor = JSON.parse(ret.Data);
        if (!actor) {
            popupMsg("json decode error", "error");
            return null;
        }

        let node = new SceneNode();
        node.name = info.name as string;
        node.file = fileName as string;
        node.actor = actor;

        if (info.data.uiLayout) {
            node.uiLayout = new UI.Layout(info.data.uiLayout, true);
        }

        if (info.transform) {
            let transform = new Scene.Transform();
            transform.fromObj(info.transform);
            node.transform = transform;
        }

        node.children = [];

        return node;
    }
}