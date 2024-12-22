import { ProjectModel } from "../model/project";
import { Evt } from "../util/event";

export class ProjectCtrl {
    model: ProjectModel

    constructor(model: ProjectModel) {
        this.model = model;
    }

    async openProject() {
        let ret = await goOpenProject();
        if (ret.Error) {
            if (ret.Error != "cancel") {
                popupMsg(ret.Error, "error");
            }
            return;
        }

        this.model.name = ret.Data as string;
        this.model.postEvent(Evt.openProject);
    }

    async getNewProjectDir() {
        let ret = await goSelectDir();
        if (ret.Error) {
            if (ret.Error != "cancel") {
                popupMsg(ret.Error, "error");
            }
            return;
        }

        this.model.dir = ret.Data as string;
        this.model.postEvent(Evt.getProjectDirDone);
    }

    openProjectDone() {
        this.model.postEvent(Evt.openProjectDone);
    }
}
