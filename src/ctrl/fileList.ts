import { FileListModel, FileInfo } from "../model/fileList";
import { Evt } from "../util/event";

class GoFileListRet {
    dir: string = ""
    files: FileInfo[] = []
}

export class FileListCtrl {
    model: FileListModel

    constructor(model: FileListModel) {
        this.model = model;
    }

    showRoot() {
        this.model.currentDir = ".";
        this.show();
    }

    async show(click: string = "") {
        let ret = await goListFiles(this.model.currentDir, click);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        let data = ret.Data as GoFileListRet;
        this.model.currentDir = data.dir;
        this.model.files = data.files;

        this.model.postEvent(Evt.fileListUpdate);
    }

    async createFolder(name: string) {
        let ret = await goCreateFolder(this.model.currentDir, name);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        this.show();
    }

    editFile(name: string) {
        if (name.endsWith(".json")) {
            this.model.postEvent(Evt.editJsonFile, this.model.currentDir + "/" + name);
        }
    }

    async delFile(name: string) {
        let ret = await goDeleteFile(name);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        this.show();
    }

    revealInExplorer() {
        goRevealInExplorer(this.model.currentDir);
    }
}