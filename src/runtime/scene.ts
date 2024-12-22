import { GameObjects, Tilemaps, Math as PhaserMath } from "phaser";
import { Transform as TransUtil } from "./transform";
import { Util } from "./util";

export namespace Scene {
    export class Transform {
        pos: PhaserMath.Vector3
        scale: PhaserMath.Vector2
        angle: number

        constructor() {
            this.pos = new PhaserMath.Vector3(0, 0, 0);
            this.scale = new PhaserMath.Vector2(1, 1);
            this.angle = 0;
        }

        fromObj(obj: any) {
            this.angle = obj.angle || 0;
            this.pos = new PhaserMath.Vector3(
                obj.pos.x, obj.pos.y, obj.pos.z,
            );
            this.scale = new PhaserMath.Vector2(
                obj.scale.x, obj.scale.y,
            );
        }
    }

    export type NodeConfig = {
        id: string
        name: string
        kind: string
        transform: Transform
        gameNode: GameObjects.GameObject | Tilemaps.Tilemap | null
        data: Map<string, any>
    }

    export class Node {
        id: string
        name: string
        kind: string
        data: Map<string, any>
        gameNode: GameObjects.GameObject | Tilemaps.Tilemap | null
        transform: Transform
        matrix: TransUtil.Mat3

        private parent: Node | null
        private children: Node[]

        constructor(parent: Node | null, config: NodeConfig) {
            this.id = config.id;
            this.name = config.name;
            this.kind = config.kind;
            this.data = config.data;
            this.gameNode = config.gameNode;
            this.parent = parent;
            this.children = [];
            this.transform = config.transform;
            this.apply();

            if (this.kind != "tileMap") {
                let gameObj = this.gameNode as GameObjects.GameObject;
                if (gameObj) {
                    gameObj.setData("sceneNode", this);
                }
            }
        }

        toObj(): any {
            let children = [];
            for (let i = 0; i < this.children.length; ++i) {
                children.push(this.children[i].toObj());
            }

            let data = Object.fromEntries(this.data.entries());

            return {
                children: children,
                data: data,
                name: this.name,
                kind: this.kind,
                transform: this.transform,
            };
        }

        getChildren(): Node[] {
            return this.children;
        }

        getParent(): Node | null {
            return this.parent;
        }

        addChild(node: Node) {
            this.children.push(node);
        }

        setParent(parent: Node | null) {
            this.parent = parent;
        }

        updateTransform(transform: Transform) {
            this.transform.pos.x = transform.pos.x;
            this.transform.pos.y = transform.pos.y;
            this.transform.pos.z = transform.pos.z;

            this.transform.scale.x = transform.scale.x;
            this.transform.scale.y = transform.scale.y;

            this.transform.angle = transform.angle;

            this.apply();
        }

        apply() {
            let scaleMat = TransUtil.scale2D(this.transform.scale.x, this.transform.scale.y);
            let angleMat = TransUtil.rotate2D(this.transform.angle);
            let transMat = TransUtil.translate2D(this.transform.pos.x, this.transform.pos.y);

            TransUtil.matrixMul(transMat, angleMat, transMat);
            TransUtil.matrixMul(transMat, scaleMat, transMat);
            this.matrix = transMat;

            this.updateGameNodeTransform();
        }

        updateGameNodeTransform() {
            if (this.gameNode && this.kind != "tileMap") {
                this.doUpdateGameNodeTransform();
            }

            for (let i = 0; i < this.children.length; i++) {
                this.children[i].updateGameNodeTransform();
            }
        }

        private doUpdateGameNodeTransform() {
            let gameTrans = this.gameNode as unknown as GameObjects.Components.Transform;
            if (!gameTrans) {
                return;
            }

            let pos = this.worldPos();
            gameTrans.x = pos[0];
            gameTrans.y = pos[1];

            let scale = this.worldScale();
            gameTrans.scaleX = scale.x;
            gameTrans.scaleY = scale.y;

            gameTrans.angle = this.worldAngle();

            let depth = this.gameNode as unknown as GameObjects.Components.Depth;
            if (!depth) {
                return;
            }

            depth.depth = this.transform.pos.z;
        }

        delGameNode() {
            if (this.gameNode && this.kind != "tileMap") {
                this.gameNode.destroy(true);
                this.gameNode = null;
            }

            for (let i = 0; i < this.children.length; i++) {
                this.children[i].delGameNode();
            }
        }

        worldMatrix(): TransUtil.Mat3 {
            if (!this.parent) {
                return this.matrix;
            }

            let arr = [this.matrix];
            for (let parent: Node | null = this.parent; parent; parent = parent.parent) {
                arr.push(parent.matrix);
            }

            let target = TransUtil.maxtrixCopy(arr[arr.length - 1]);
            for (let i = arr.length - 2; i >= 0; i--) {
                TransUtil.matrixMul(target, arr[i], target);
            }

            return target;
        }

        worldPos(): number[] {
            return this.local2World(0, 0);
        }

        worldAngle() {
            let angle = this.transform.angle;
            for (let parent: Node | null = this.parent; parent; parent = parent.parent) {
                angle += parent.transform.angle;
            }

            return this.fixAngle(angle);
        }

        fixAngle(angle: number) {
            return Util.roundNum(angle, -180, 180);
        }

        worldScale() {
            let x = this.transform.scale.x;
            let y = this.transform.scale.y;
            for (let parent: Node | null = this.parent; parent; parent = parent.parent) {
                x *= parent.transform.scale.x;
                y *= parent.transform.scale.y;
            }

            return { x: x, y: y };
        }

        local2World(x: number, y: number): TransUtil.Vec3 {
            let mat = this.worldMatrix();
            let vec: TransUtil.Vec3 = [x, y, 1];
            TransUtil.matrixMulVec(mat, vec, vec);

            return vec;
        }

        world2Local(x: number, y: number): TransUtil.Vec3 {
            let mat = this.worldMatrix();
            let vec: TransUtil.Vec3 = [x, y, 1];
            mat = TransUtil.matrixInverse(mat);
            TransUtil.matrixMulVec(mat, vec, vec);

            return vec;
        }

        delChild(child: Node) {
            for (let i = 0; i < this.children.length; i++) {
                if (child == this.children[i]) {
                    this.children.splice(i, 1);
                    break;
                }
            }
        }
    }

    export class NodeTree {
        private children: Node[]

        constructor() {
            this.children = [];
        }

        toObj(): any {
            if (this.children.length == 0) {
                return null;
            }

            let children = [];
            for (let i = 0; i < this.children.length; ++i) {
                children.push(this.children[i].toObj());
            }

            return children;
        }

        getChildren(): Node[] {
            return this.children;
        }

        addNode(parentPath: number[] | null, config: NodeConfig): Node {
            let parent = Util.treeNodeFindByPath(this.children, parentPath, (node: any) => {
                let sceneNode = node as Node;
                return sceneNode.getChildren();
            }) as Node;
            let node = new Node(parent, config);

            if (parent) {
                parent.addChild(node);
            } else {
                this.children.push(node);
            }

            return node;
        }

        moveNode(oldPath: number[], newParentPath: number[] | null) {
            let node = Util.treeNodeFindByPath(this.children, oldPath, (node: any) => {
                let sceneNode = node as Node;
                return sceneNode.getChildren();
            }) as Node;
            if (!node) {
                return;
            }

            let oldParent = node.getParent();
            let children = oldParent ? oldParent.getChildren() : this.children;
            Util.treeNodeDel(children, node);

            let parent = Util.treeNodeFindByPath(this.children, newParentPath, (node: any) => {
                let sceneNode = node as Node;
                return sceneNode.getChildren();
            }) as Node;
            if (parent) {
                parent.addChild(node);
            } else {
                this.children.push(node);
            }

            node.setParent(parent);
            node.updateGameNodeTransform();
        }

        delNode(path: number[]): Node | null {
            let node = Util.treeNodeFindByPath(this.children, path, (node: any) => {
                let sceneNode = node as Node;
                return sceneNode.getChildren();
            }) as Node;
            if (!node) {
                return null;
            }

            let parent = node.getParent();
            if (parent) {
                Util.treeNodeDel(parent.getChildren(), node);
            } else {
                Util.treeNodeDel(this.children, node);
            }

            node.delGameNode();
            return node;
        }

        findNodeByPath(path: number[]): Node | null {
            let node = Util.treeNodeFindByPath(this.children, path, "children") as Node;
            return node;
        }

        getNodePath(node: Node) {
            return Util.treeNodeGetPath(node, "children", "parent", this.children)
        }
    }
}