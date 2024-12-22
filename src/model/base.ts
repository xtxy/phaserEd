import { eventManager, Evt } from "../util/event";

export class BaseModel {
    postEvent(evt: Evt, param?: any) {
        setTimeout((evt, param)=>{
            eventManager.process(evt, param);
        }, 0, evt, param);
    }

    sendEvent(evt: Evt, param?: any) {
        eventManager.process(evt, param);
    }
}

export class ModelMgr {
    static models: Map<new () => BaseModel, BaseModel> = new Map();

    static set<T extends BaseModel>(type: new () => T, model: T): string {
        if (ModelMgr.models.has(type)) {
            return "duplicate:" + type.name;
        }

        ModelMgr.models.set(type, model);
        return "";
    }

    static get<T extends BaseModel>(type: { new (): T }): T {
        return ModelMgr.models.get(type) as T
    }
}