import { JsonEditModel } from "../model/jsonEdit";
import { Evt } from "../util/event";

export class JsonEditCtrl {
    model: JsonEditModel

    constructor(model: JsonEditModel) {
        this.model = model;
    }

    async edit(name: string) {
        let ret = await goReadFile(name, false);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        let jsonData: any;
        try {
            jsonData = JSON.parse(ret.Data as string);
        } catch (e) {
            console.log("json parse error:", e);
            popupMsg("json parse error", "error");
            return;
        }

        this.model.fileName = name;
        this.model.fileData = jsonData;

        this.model.postEvent(Evt.editJsonFileShow);
    }

    async saveFile(data: any) {
        let dataStr = JSON.stringify(data, undefined, "    ");
        let ret = await goCreateFile(this.model.fileName, dataStr, false);
        if (ret.Error) {
            popupMsg(ret.Error, "error");
            return;
        }

        this.model.dirty = false;
        this.model.postEvent(Evt.editJsonFileDirty);
    }

    fileChange() {
        this.model.dirty = true;
        this.model.postEvent(Evt.editJsonFileDirty);
    }

    fileDone() {
        this.model.dirty = false;
        this.model.postEvent(Evt.editJsonFileDone);
    }
}