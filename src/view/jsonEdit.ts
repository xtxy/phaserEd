import { JsonEditCtrl } from "../ctrl/jsonEdit";
import { Evt, eventManager } from "../util/event";

export class JsonEditView {
    ctrl: JsonEditCtrl
    editor: any

    constructor(ctrl: JsonEditCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.editJsonFile, this);
        eventManager.register(Evt.editJsonFileShow, this);
        eventManager.register(Evt.editJsonFileDirty, this);
        eventManager.register(Evt.editJsonFileDone, this);
    }

    processEvent(evt: Evt, param: any): void {
        switch (evt) {
            case Evt.editJsonFile:
                this.onEditJsonFile(param as string);
                break;

            case Evt.editJsonFileShow:
                this.onShow();
                break;

            case Evt.editJsonFileDirty:
                this.onJsonDirty();
                break;

            case Evt.editJsonFileDone:
                this.onJsonDone();
                break;
        }
    }

    saveFile() {
        if (!this.editor || !this.ctrl.model.dirty) {
            return;
        }

        let data: any;
        try {
            data = this.editor.get();
        } catch (e) {
            console.log("json editor get exception:", e);
            popupMsg("invalid json", "error");
            return;
        }

        this.ctrl.saveFile(data);
    }

    closeEditor() {
        if (!this.ctrl.model.dirty) {
            this.ctrl.fileDone();
            return;
        }

        uiConfirm({
            title: "Discard Change?",
            text: "Discard change for " + this.ctrl.model.fileName + " ?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            this.ctrl.fileDone();
        });
    }

    fileChange() {
        this.ctrl.fileChange();
    }

    private onEditJsonFile(name: string) {
        this.ctrl.edit(name);
    }

    private onShow() {
        uiShow("jsonEditWindow").show();
        uiItem("jsonEditFileName").setValue(this.ctrl.model.fileName);

        let editor = createJsonEditor(gbData.jsonEditDiv, this.fileChange.bind(this));
        editor.set(this.ctrl.model.fileData);

        this.editor = editor;
    }

    private onJsonDirty() {
        if (this.ctrl.model.dirty) {
            uiItem("jsonEditFileName").setHTML("<font color='#ff9700'>" +
                this.ctrl.model.fileName +
                " *</font>"
            );
        } else {
            uiItem("jsonEditFileName").setHTML("<font color='#000000'>" +
                this.ctrl.model.fileName +
                "</font>"
            );
        }
    }

    private onJsonDone() {
        uiItem("jsonEditWindow").close();
        this.editor = null;
    }
}