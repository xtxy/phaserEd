import { FileListCtrl } from "../ctrl/fileList";
import { eventManager, Evt } from "../util/event";

export class FileListView {
    ctrl: FileListCtrl

    constructor(ctrl: FileListCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.openProjectDone, this);
        eventManager.register(Evt.fileListShow, this);
        eventManager.register(Evt.fileListUpdate, this);
    }

    processEvent(evt: Evt, param: any): void {
        switch (evt) {
            case Evt.openProjectDone:
                this.ctrl.showRoot();
                break;

            case Evt.fileListShow:
                this.show(param as string);
                break;

            case Evt.fileListUpdate:
                uiItem("projectDir").setValue(this.ctrl.model.currentDir);
                uiItem("fileList").clearAll();
                uiItem("fileList").parse(this.ctrl.model.files);
                break;
        }
    }

    clickItem(id: any) {
        let item = uiItem("fileList").getItem(id);
        if (item.Dir) {
            this.show(item.Name as string);
        } else {
            uiItem("fileList").select(id);
        }
    }

    editFile() {
        let item = uiItem("fileList").getSelectedItem();
        if (!item || item.Dir) {
            return;
        }

        this.ctrl.editFile(item.Name);
    }

    delFile(name: string) {
        name = this.ctrl.model.currentDir + "/" + name;
        uiConfirm({
            title: "Delete File",
            text: "Delete " + name + "?",
            ok: "Yes",
            cancel: "No",
        }).then(() => {
            this.ctrl.delFile(name);
        });
    }

    createFolder() {
        uiPrompt({
            title: "Create Folder",
            text: "Input folder name",
            ok: "Ok",
            cancel: "Cancel",
            input: {
                required: true,
                value: "",
                placeholder: "name",
            },
        }).then((result: string)=> {
            this.ctrl.createFolder(result);
        });
    }

    revealInExplorer() {
        this.ctrl.revealInExplorer();
    }

    private show(click: string) {
        this.ctrl.show(click);
    }
}