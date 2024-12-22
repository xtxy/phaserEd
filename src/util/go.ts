class GoCallRet {
    Error: string = ""
    Data: any
}

var goCreateFolder: (parent: string, name: string) => Promise<GoCallRet>;
var goSelectDir: () => Promise<GoCallRet>;
var goOpenProject: () => Promise<GoCallRet>;
var goListFiles: (dir: string, click: string) => Promise<GoCallRet>;
var goReadFile: (name: string, bin: boolean) => Promise<GoCallRet>;
var goCreateFile: (name: string, data: any, bin: boolean) => Promise<GoCallRet>;
var goDeleteFile: (name: string) => Promise<GoCallRet>;
var goLoadImage: (name: string) => Promise<GoCallRet>;
var goRevealInExplorer: (name: string) => Promise<GoCallRet>;

type SplitMapTilesRet = {
    data: string, width: number, height: number, interval: number,
};
var goSplitMapTiles: (name: string, tileWidth: number, tileHeight: number) => Promise<GoCallRet>;
var goCombineTiles: (name: string, tileWidth: number, tileHeight: number, tiles: any[]) => Promise<GoCallRet>;
var goSaveTileMapSelect: (name: string, tileWidth: number, tileHeight: number, tiles: any[]) => Promise<GoCallRet>;