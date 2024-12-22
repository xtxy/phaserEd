import { SceneCtrl } from "../ctrl/scene";
import { SceneNode, SceneNodeSelectParam, SceneNodeUpdateParam } from "../model/scene";
import { UI } from "../runtime/ui";
import { Evt, eventManager } from "../util/event";
import { ModelMgr } from "../model/base";
import { FileListModel } from "../model/fileList";
import { Script } from "../runtime/script";
import { waitUntilNextFrame } from "../util/util";

export class NodeEditView {
    ctrl: SceneCtrl

    constructor(ctrl: SceneCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.sceneShow, this);
        eventManager.register(Evt.sceneNodeSelect, this);
        eventManager.register(Evt.sceneNodeUpdate, this);
    }

    processEvent(evt: Evt, param: any) {
        switch (evt) {
            case Evt.sceneShow:
                uiItem("nodeEditPage").show();
                break;

            case Evt.sceneNodeSelect:
                this.onNodeSelect(param as SceneNodeSelectParam);
                break;

            case Evt.sceneNodeUpdate:
                this.onNodeUpdate(param as SceneNodeUpdateParam);
                break;
        }
    }

    modifyPosX() {
        let x = this.getNumInt(uiItem("nodePosX").getValue());
        this.ctrl.modifySelectedNode("posX", x);
    }

    modifyPosY() {
        let y = this.getNumInt(uiItem("nodePosY").getValue());
        this.ctrl.modifySelectedNode("posY", y);
    }

    modifyPosZ() {
        let z = this.getNumInt(uiItem("nodePosZ").getValue());
        this.ctrl.modifySelectedNode("posZ", z);
    }

    modifyScaleX() {
        let x = this.getNumInt(uiItem("nodeScaleX").getValue());
        this.ctrl.modifySelectedNode("scaleX", x);
    }

    modifyScaleY() {
        let y = this.getNum(uiItem("nodeScaleY").getValue());
        this.ctrl.modifySelectedNode("scaleY", y);
    }

    modifyAngle() {
        let a = this.getNum(uiItem("nodeAngle").getValue());
        this.ctrl.modifySelectedNode("angle", a);
    }

    modifyUILayoutAnchor(value: string) {
        this.ctrl.modifySelectedNode("uiLayoutAnchor", value);
    }

    modifyUILayoutOffsetKind(value: string) {
        this.ctrl.modifySelectedNode("uiLayoutOffsetKind", value);
    }

    modifyUILayoutOffsetX() {
        let x = this.getNum(uiItem("uiLayoutOffsetX").getValue());
        this.ctrl.modifySelectedNode("uiLayoutOffsetX", x);
    }

    modifyUILayoutOffsetY() {
        let y = this.getNum(uiItem("uiLayoutOffsetY").getValue());
        this.ctrl.modifySelectedNode("uiLayoutOffsetY", y);
    }

    getNumInt(numStr: string): number {
        let num = parseInt(numStr);
        if (isNaN(num)) {
            num = 0;
        }

        return num;
    }

    getNum(numStr: string): number {
        let num = parseFloat(numStr);
        if (isNaN(num)) {
            num = 0;
        }

        return num;
    }

    updateNode(node: SceneNode) {
        uiItem("nodeName").setValue(node.name);
        uiItem("nodePosX").setValue(node.transform.pos.x);
        uiItem("nodePosY").setValue(node.transform.pos.y);
        uiItem("nodePosZ").setValue(node.transform.pos.z);
        uiItem("nodeScaleX").setValue(node.transform.scale.x);
        uiItem("nodeScaleY").setValue(node.transform.scale.y);
        uiItem("nodeAngle").setValue(node.transform.angle);

        if (node.uiLayout) {
            uiItem("uiLayoutForm").show();
            this.showUILayout(node.uiLayout);
        } else {
            uiItem("uiLayoutForm").hide();
        }

        let ids = new Set<string>();
        let views = uiItem("otherNodeEdit").getChildViews();
        for (let view of views) {
            console.log("other node edit:", view.config);
            ids.add(view.config.id);
        }

        switch (node.actor.kind) {
            case "button":
                if (!ids.has("buttonEditForm")) {
                    uiItem("otherNodeEdit").addView(uiGet("buttonEditForm"));
                }
                break;

            case "sprite":
                if (!ids.has("spriteEditForm")) {
                    uiItem("otherNodeEdit").addView(uiGet("spriteEditForm"));
                }
                break;
        }

        // this.updateScripts(node);
    }

    addUILayout() {
        let node = this.ctrl.getSelectedNode();
        if (!node || node.node.uiLayout) {
            return;
        }

        node.node.uiLayout = new UI.Layout();
        this.ctrl.updateSelectedNode();
    }

    delUILayout() {
        let node = this.ctrl.getSelectedNode();
        if (!node || !node.node.uiLayout) {
            return;
        }

        uiConfirm({
            title: "Delete UI Layout",
            text: "Delete UI Layout for " + node.node.name + "?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            node.node.uiLayout = undefined;
            this.ctrl.updateSelectedNode();
        });
    }

    addScript() {
        let item = uiItem("fileList").getSelectedItem();
        if (!item) {
            return;
        }

        if (!item.Name.endsWith(".ts")) {
            popupMsg("scripte type error", "error");
            return;
        }

        let fileListModel = ModelMgr.get(FileListModel);
        let name = fileListModel.currentDir + "/" + item.Name;
        this.ctrl.addScript4Node(name);
    }

    delScript(id: string) {
        let arr = id.split("_");
        let index = parseInt(arr[1]);
        this.ctrl.delScript4Node(index);
    }

    scriptPropChange(id: string, value: string) {
        let arr = id.split("_");
        this.ctrl.editScript4Node(parseInt(arr[1]), arr[3], value);
    }

    private onNodeSelect(param: SceneNodeSelectParam) {
        this.updateNode(param.node);
    }

    private onNodeUpdate(param: SceneNodeUpdateParam) {
        if (param.node.select) {
            this.updateNode(param.node);
        }
    }

    private showUILayout(layout: UI.Layout) {
        let kind = layout.getAnchorString();
        uiItem("uiLayoutAnchor").setValue(kind);

        let offsetKind = layout.getOffsetKindString();
        uiItem("uiLayoutOffset").setValue(offsetKind);

        uiItem("uiLayoutOffsetX").setValue(layout.offset.x);
        uiItem("uiLayoutOffsetY").setValue(layout.offset.y);
    }

    // private async updateScripts(node: SceneNode) {
    //     let scriptViews = uiItem("nodeScripts").getChildViews();
    //     console.log("before update:");
    //     for (let i = 0; i < scriptViews.length; ++i) {
    //         console.log(scriptViews[i].config.id);
    //     }
    //     console.log("before update end");

    //     if (!node.scripts || node.scripts.length == 0) {
    //         for (let view of scriptViews) {
    //             uiItem("nodeScripts").removeView(view);
    //         }

    //         return;
    //     }

    //     let viewLen = scriptViews.length;
    //     console.log("view len:", viewLen);

    //     for (let i = 0; i < node.scripts.length; ++i) {
    //         let script = node.scripts[i];
    //         let id = "nodeScript_" + i;
    //         console.log("id:", id);

    //         if (i >= viewLen) {
    //             this.addNewScript(id, script, i);
    //         } else {
    //             if (!this.checkScript(id, script)) {
    //                 this.addNewScript(id, script, i);
    //             } else {
    //                 this.setScriptProp(id, script);
    //             }
    //         }
    //     }

    //     await waitUntilNextFrame();

    //     scriptViews = uiItem("nodeScripts").getChildViews();
    //     if (scriptViews && scriptViews.length > 0) {
    //         for (let i = node.scripts.length; i < scriptViews.length; ++i) {
    //             uiItem("nodeScripts").removeView(scriptViews[i]);
    //         }
    //     }

    //     await waitUntilNextFrame();

    //     scriptViews = uiItem("nodeScripts").getChildViews();
    //     console.log("after update:");
    //     for (let i = 0; i < scriptViews.length; ++i) {
    //         console.log(scriptViews[i].config.id);
    //     }
    //     console.log("after update end");
    // }

    // private addNewScript(id: string, script: Script.ClassInfo, index: number) {
    //     let props = [];
    //     for (let prop of script.properties) {
    //         props.push(
    //             {
    //                 name: prop.name,
    //                 value: prop.value,
    //             }
    //         );
    //     }

    //     console.log("add node script:", id, script.name, script.file, index);
    //     addNodeScript(id, script.name, script.file, props, index);

    //     console.log("add node script done");
    // }

    // private checkScript(id: string, script: Script.ClassInfo): boolean {
    //     let className = uiItem(id + "_class").config.label;
    //     if (className != script.name) {
    //         console.log("check script class name different:", id, className, script.name);
    //         return false;
    //     }

    //     let fileName = uiItem(id + "_file").config.label;
    //     if (fileName != script.file) {
    //         console.log("check script file name different:", id, fileName, script.file);
    //         return false;
    //     }

    //     let pfx = id + "_prop_";
    //     let ids: string[] = script.properties.map(item => pfx + item.name);
    //     if (ids.length > 0) {
    //         ids.sort();
    //     }

    //     console.log("check script, data ids:", ids);

    //     let views = uiItem(id).getChildViews() as any[];
    //     let viewIds = views.filter(item => item.config.id.startsWith(pfx)).map(item => item.config.id);
    //     if (viewIds.length > 0) {
    //         viewIds.sort();
    //     }

    //     console.log("check script, view ids:", viewIds);

    //     if (ids.length != viewIds.length) {
    //         return false;
    //     };

    //     for (let i = 0; i < ids.length; ++i) {
    //         if (ids[i] != viewIds[i]) {
    //             return false;
    //         }
    //     }

    //     console.log("check script, return true");

    //     return true;
    // }

    // private setScriptProp(id: string, script: Script.ClassInfo) {
    //     for (let prop of script.properties) {
    //         let propId = id + "_prop_" + prop.name;
    //         uiItem(propId).setValue(prop.value);
    //     }
    // }
}