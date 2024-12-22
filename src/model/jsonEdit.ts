import { BaseModel } from "./base";

export class JsonEditModel extends BaseModel {
    fileName: string = ""
    fileData: string = ""
    dirty: boolean = false
}