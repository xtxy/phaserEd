import { Scene, Input, Math, GameObjects } from "phaser";
import { Scene as RuntimeScene } from "../runtime/scene";
import { UI } from "../runtime/ui";

export class GameNode {
    name: string
    kind: string
    file: string
    transform: RuntimeScene.Transform
    uiLayout?: UI.Layout
    actor: any
}

export class SceneHelper {
    handleMouse: boolean
    worldPoint: Math.Vector2
    sceneNodeTree: RuntimeScene.NodeTree
    
    private scene: Scene
    private downWorldPoint: Math.Vector2
    private clickObj: GameObjects.GameObject | null
    private clickObjX: number
    private clickObjY: number

    constructor(scene: Scene) {
        this.scene = scene;
        this.sceneNodeTree = new RuntimeScene.NodeTree();
        this.downWorldPoint = new Math.Vector2();
        this.worldPoint = new Math.Vector2();
    }

    checkClickObj(pointer: Input.Pointer) {
        this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, this.downWorldPoint);

        let objs = this.scene.input.hitTestPointer(pointer);
        if (!objs || objs.length == 0) {
            this.clickObj = null;
            return;
        }

        this.clickObj = objs[objs.length - 1];
        let trans = this.clickObj as unknown as GameObjects.Components.Transform;
        this.clickObjX = trans.x;
        this.clickObjY = trans.y;
    }

    clickObjMove(): RuntimeScene.Node | null {
        if (!this.clickObj) {
            return null;
        }

        let newX = this.clickObjX + this.worldPoint.x - this.downWorldPoint.x;
        let newY = this.clickObjY + this.worldPoint.y - this.downWorldPoint.y;

        let sceneNode = this.clickObj.getData("sceneNode") as RuntimeScene.Node;
        let parent = sceneNode.getParent();
        if (parent) {
            let pos = parent.world2Local(newX, newY);
            sceneNode.transform.pos.x = pos[0];
            sceneNode.transform.pos.y = pos[1];
        } else {
            sceneNode.transform.pos.x = newX;
            sceneNode.transform.pos.y = newY;
        }

        sceneNode.apply();

        if (sceneNode.data.has("uiLayout")) {
            let uiLayout = sceneNode.data.get("uiLayout") as UI.Layout;
            uiLayout.setByTransform(this.scene, sceneNode.transform.pos);
        }

        return sceneNode;
    }

    moveNode(oldPath: number[], newParentPath: number[] | null) {
        this.sceneNodeTree.moveNode(oldPath, newParentPath);
    }

    delNode(path: number[]) {
        this.sceneNodeTree.delNode(path);
    }

    updateNode(path: number[], node: GameNode): RuntimeScene.Node | null {
        let sceneNode = this.sceneNodeTree.findNodeByPath(path);
        if (!sceneNode) {
            return null;
        }

        sceneNode.updateTransform(node.transform);
        return sceneNode;
    }

    saveScene(): any {
        return this.sceneNodeTree.toObj();
    }
}
