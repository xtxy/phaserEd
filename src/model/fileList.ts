import { BaseModel } from "./base";

export class FileInfo {
    dir: boolean = false
    name: string = ""
}

export class FileListModel extends BaseModel {
    currentDir: string = ""
    files: FileInfo[] = []
}