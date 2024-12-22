import { BaseModel } from "./base";
import { Scene } from "../runtime/scene";
import { Util } from "../runtime/util";
import { Evt } from "../util/event";
import { Math as PhaserMath } from "phaser";
import { UI } from "../runtime/ui";
import { Script } from "../runtime/script";

export enum SceneEditFrom {
    GameScene,
    UIScene,
    GameNodeEdit,
    UINodeEdit,
}

export type SceneNodeNewParam = {
    parentPath: number[],
    node: SceneNode,
}

export type SceneNodeMoveParam = {
    oldPath: number[],
    newParentPath: number[] | null,
};

export type SceneNodeDelParam = {
    path: number[],
};

export type SceneNodeUpdateParam = {
    node: SceneNode,
    path: number[],
    from: SceneEditFrom,
};

export type SceneNodeSelectParam = {
    node: SceneNode,
};

export class SceneNode {
    name: string
    file: string
    actor: any
    select: boolean
    transform: Scene.Transform
    uiLayout?: UI.Layout
    children: SceneNode[]
    parent: SceneNode | null

    getChildren(): SceneNode[] {
        return this.children;
    }

    getParent(): SceneNode | null {
        return this.parent;
    }
}

export class SceneModel extends BaseModel {
    name: string
    center: PhaserMath.Vector2
    children: SceneNode[]
    uiChildren: SceneNode[]
    uiActive: boolean

    constructor() {
        super();

        this.center = new PhaserMath.Vector2();
        this.children = [];
        this.uiChildren = [];
        this.uiActive = false;
    }

    addNode(parentPath: number[] | null, node: SceneNode, sendEvent: boolean = true) {
        if ((node.uiLayout != undefined) != this.uiActive) {
            return;
        }

        let root = this.getNodeRoot();
        let parent = Util.treeNodeFindByPath(root, parentPath, "children") as SceneNode;
        if (!parent) {
            root.push(node);
        } else {
            parent.children.push(node);
        }

        if (sendEvent) {
            this.postEvent(Evt.sceneNodeNew, {parentPath: parentPath, node: node});
        }
    }

    moveNode(oldPath: number[], newParentPath: number[] | null) {
        let root = this.getNodeRoot();
        let parent = Util.treeNodeFindByPath(root, newParentPath, "children") as SceneNode;
        let node = Util.treeNodeDelByPath(root, oldPath, "children") as SceneNode;

        if (node) {
            if (parent) {
                parent.children.push(node);
            } else {
                root.push(node);
            }
        }
        
        this.postEvent(Evt.sceneNodeMove, { oldPath: oldPath, newParentPath: newParentPath});
    }

    delNode(path: number[]) {
        let root = this.getNodeRoot();
        Util.treeNodeDelByPath(root, path, "children")
        this.postEvent(Evt.sceneNodeDel, {path: path});
    }

    findNodeByPath(path: number[]): SceneNode | null {
        let root = this.getNodeRoot();
        return Util.treeNodeFindByPath(root, path, "children") as SceneNode;
    }

    getNodeRoot(): SceneNode[] {
        return this.uiActive ? this.uiChildren : this.children;
    }
}