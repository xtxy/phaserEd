import { ProjectCtrl } from "../ctrl/project";
import { eventManager, Evt } from "../util/event";

export class ProjectView {
    ctrl: ProjectCtrl

    constructor(ctrl: ProjectCtrl) {
        this.ctrl = ctrl;

        eventManager.register(Evt.getProjectDirDone, this);
        eventManager.register(Evt.openProject, this);
    }

    processEvent(evt: Evt, param: any): void {
        switch (evt) {
            case Evt.getProjectDirDone:
                uiItem("newProjectDir").setValue(this.ctrl.model.dir);
                break;

            case Evt.openProject:
                uiShow("fileListContextMenu");
                uiItem("mainPage").show();
                uiItem("fileListContextMenu").attachTo(uiItem("fileList"));
                this.ctrl.openProjectDone();
                break;
        }
    }

    openProject() {
        this.ctrl.openProject();
    }

    getNewProjectDir() {
        this.ctrl.getNewProjectDir();
    }
}
