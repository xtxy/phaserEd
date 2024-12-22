export enum Evt {
    getProjectDirDone,
    openProject,
    openProjectDone,
    fileListUpdate,
    fileListShow,
    editJsonFile,
    editJsonFileShow,
    editJsonFileDirty,
    editJsonFileDone,

    sceneNew,
    sceneSaveDone,
    sceneShow,
    sceneNodeNew,
    sceneNodeMove,
    sceneNodeDel,
    sceneNodeSelect,
    sceneNodeUpdate,
    sceneNodeParse,

    tileMapShow,
    tileMapEditShow,
    tileMapBrushChange,
    tileMapNew,
    tileMapLoadDone,
    tileMapSaveDone,
    tileMapCloseDone,
    tileMapCreateBrushByTileSet,
    tileMapEnableCollision,
    tileMapPaintCollision,
    tileMapShowCollision,
    tileMapUpdateCollision,

    tileSetLoadDone,

    tileLayerUpdate,
    tileLayerRename,
}

interface EventHandler {
    processEvent(evt: Evt, param: any): void;
}

class EventManager {
    events: Map<Evt, EventHandler[]>;

    constructor() {
        this.events = new Map<Evt, EventHandler[]>();
    }

    register(evt: Evt, handler: EventHandler) {
        let handlers = this.events.get(evt);
        if (handlers) {
            handlers.push(handler);
        } else {
            this.events.set(evt, [handler]);
        }
    }

    unRegister(evt: Evt, handler: EventHandler) {
        let arr = this.events.get(evt);
        if (!arr || arr.length == 0) {
            return;
        }

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] != handler) {
                continue;
            }

            arr.splice(i, 1);
            this.events.set(evt, arr);
            break;
        }
    }

    process(evt: Evt, param: any) {
        let arr = this.events.get(evt);
        if (!arr) {
            return;
        }

        for (let i = 0; i < arr.length; i++) {
            let handler = arr[i];
            handler.processEvent(evt, param);
        }
    }
}

export var eventManager = new EventManager();