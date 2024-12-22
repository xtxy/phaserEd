import { FileListCtrl } from "./ctrl/fileList";
import { JsonEditCtrl } from "./ctrl/jsonEdit";
import { ProjectCtrl } from "./ctrl/project";
import { SceneCtrl } from "./ctrl/scene";
import { TileMapCtrl } from "./ctrl/tileMap";
import { ModelMgr } from "./model/base";
import { FileListModel } from "./model/fileList";
import { JsonEditModel } from "./model/jsonEdit";
import { ProjectModel } from "./model/project";
import { SceneModel } from "./model/scene";
import { TileMapModel } from "./model/tileMap";
import { FileListView } from "./view/fileList";
import { JsonEditView } from "./view/jsonEdit";
import { NodeEditView } from "./view/nodeEdit";
import { ProjectView } from "./view/project";
import { SceneView } from "./view/scene";
import { SceneNodeView } from "./view/sceneNode";
import { TileMapView } from "./view/tileMap";
import { TileMapEditView } from "./view/tileMapEdit";
import { TileSetView } from "./view/tileSet";

function initMvc() {
    let projectModel = new ProjectModel();
    let projectCtrl = new ProjectCtrl(projectModel);
    let projectView = new ProjectView(projectCtrl);

    let fileListModel = new FileListModel();
    let fileListCtrl = new FileListCtrl(fileListModel);
    let fileListView = new FileListView(fileListCtrl);

    let sceneModel = new SceneModel();
    let sceneCtrl = new SceneCtrl(sceneModel);
    let sceneView = new SceneView(sceneCtrl);
    let sceneNodeView = new SceneNodeView(sceneCtrl);
    let nodeEditView = new NodeEditView(sceneCtrl);

    let tileMapModel = new TileMapModel();
    let tileMapCtrl = new TileMapCtrl(tileMapModel);
    let tileMapView = new TileMapView(tileMapCtrl);
    let tileSetView = new TileSetView(tileMapCtrl);
    let tileMapEditView = new TileMapEditView(tileMapCtrl);

    let jsonEditModel = new JsonEditModel();
    let jsonEditCtrl = new JsonEditCtrl(jsonEditModel);
    let jsonEditView = new JsonEditView(jsonEditCtrl);


    ModelMgr.set(ProjectModel, projectModel);
    ModelMgr.set(FileListModel, fileListModel);
    ModelMgr.set(SceneModel, sceneModel);
    ModelMgr.set(TileMapModel, tileMapModel);
    ModelMgr.set(JsonEditModel, jsonEditModel);

    registerView("project", projectView);
    registerView("fileList", fileListView);
    registerView("scene", sceneView);
    registerView("sceneNode", sceneNodeView);
    registerView("nodeEdit", nodeEditView);
    registerView("tileMap", tileMapView);
    registerView("tileSet", tileSetView);
    registerView("tileMapEdit", tileMapEditView);
    registerView("jsonEdit", jsonEditView);
}

export function main() {
    initMvc();
    uiShow("entry");
}


