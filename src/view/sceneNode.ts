import { SceneCtrl } from "../ctrl/scene";
import { ModelMgr } from "../model/base";
import { FileListModel } from "../model/fileList";
import { SceneNode, SceneNodeDelParam, SceneNodeMoveParam, SceneNodeNewParam } from "../model/scene";
import { eventManager, Evt } from "../util/event";

type TreeNode = {
    id: any,
    name: string,
    kind: string,
    data: TreeNode[],
};

export class SceneNodeView {
    ctrl: SceneCtrl

    constructor(ctrl: SceneCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.sceneNodeNew, this);
        eventManager.register(Evt.sceneNodeMove, this);
        eventManager.register(Evt.sceneNodeDel, this);
        eventManager.register(Evt.sceneNodeParse, this);
    }

    processEvent(evt: Evt, param: any) {
        switch (evt) {
            case Evt.sceneNodeNew:
                this.onNodeNew(param as SceneNodeNewParam);
                break;

            case Evt.sceneNodeMove:
                this.onNodeMove(param as SceneNodeMoveParam);
                break;

            case Evt.sceneNodeDel:
                this.onNodeDel(param as SceneNodeDelParam);
                break;

            case Evt.sceneNodeParse:
                this.onNodeParse();
                break;
        }
    }

    dropIn(context: any) {
        let toTreeId = context.to.config.id;
        let tree = uiItem(toTreeId);

        let parents: number[] | null = null;
        if (context.target) {
            parents = getTreePathById(tree, context.target) as number[];
        }

        let fromId = context.from.config.id;
        let toId = context.to.config.id;
        console.log("to id:", toId);
        switch (fromId) {
            case "fileList":
                {
                    let item = context.from.getItem(context.source);
                    if (!item.Name.endsWith(".json")) {
                        return;
                    }

                    let fileListModel = ModelMgr.get(FileListModel);
                    this.ctrl.addNodeFromFile(fileListModel.currentDir + "/" + item.Name, parents);
                }
                break;

            case "uiSceneNodeTree":
            case "gameSceneNodeTree":
                {
                    let oldParentId = tree.getParentId(context.source);
                    if (context.target == oldParentId) {
                        break;
                    }

                    let oldPath = getTreePathById(tree, context.source);
                    this.ctrl.moveNode(oldPath, parents);
                }
                break;
        }
    }

    selectNode(id: any) {
        let tree = this.getTree();
        let path = getTreePathById(tree, id) as number[];
        this.ctrl.selectNode(path);
    }

    delNode() {
        let tree = this.getTree();
        let id = tree.getSelectedId();
        if (!id) {
            return;
        }

        uiConfirm({
            title: "Del Scene Node",
            text: "Delete current scene node?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            let path = getTreePathById(tree, id) as number[];
            this.ctrl.delNode(path);
        });
    }

    private onNodeNew(param: SceneNodeNewParam) {
        let node = this.sceneNode2TreeNode(param.node);
        let tree = this.getTree();

        let id: any;
        if (param.parentPath && param.parentPath.length > 0) {
            let parentId = getTreeItemIdByPath(tree, param.parentPath);
            let parent = tree.getItem(parentId);

            id = tree.add(node, parent.data.length, parentId);
            tree.open(parentId);
        } else {
            id = tree.add(node);
        }

        tree.select(id);
    }

    private onNodeMove(param: SceneNodeMoveParam) {
        let tree = this.getTree();
        let id = getTreeItemIdByPath(tree, param.oldPath);

        if (param.newParentPath && param.newParentPath.length > 0) {
            let parentId = getTreeItemIdByPath(tree, param.newParentPath);
            tree.move(id, -1, tree, { parent: parentId });
            tree.open(parentId);
        } else {
            tree.move(id, -1, tree, { parent: 0 });
        }

        tree.select(id);
    }

    private onNodeDel(param: SceneNodeDelParam) {
        let tree = this.getTree();
        let id = getTreeItemIdByPath(tree, param.path);
        tree.remove(id);
    }

    private onNodeParse() {
        this.parseNodes("gameSceneNodeTree", this.ctrl.model.children);
        this.parseNodes("uiSceneNodeTree", this.ctrl.model.uiChildren);
    }

    private parseNodes(treeName: string, nodes: SceneNode[]) {
        let arr = this.parseNodeArr(nodes);
        let tree = uiItem(treeName);

        tree.clearAll();
        tree.parse({
            "data": arr,
        });
    }

    private parseNodeArr(sceneNodes: SceneNode[]): TreeNode[] {
        let nodes: TreeNode[] = [];
        for (let i = 0; i < sceneNodes.length; ++i) {
            let node = this.sceneNode2TreeNode(sceneNodes[i]);

            if (sceneNodes[i].children.length > 0) {
                node.data = this.parseNodeArr(sceneNodes[i].children);
            }

            nodes.push(node);
        }

        return nodes;
    }

    private sceneNode2TreeNode(node: SceneNode): TreeNode {
        return {
            id: uiNewId(),
            name: node.name,
            kind: node.actor.kind as string,
            data: [],
        };
    }

    private getTree(): any {
        let treeId = this.ctrl.model.uiActive ? "uiSceneNodeTree" : "gameSceneNodeTree";
        return uiItem(treeId);
    }
}