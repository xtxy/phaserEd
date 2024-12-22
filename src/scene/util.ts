import { Scene } from "phaser";
import { TileMap } from "../runtime/tileMap";
import { Util } from "../runtime/util";

export namespace SceneUtil {
    export async function checkMapTexture(scene: Scene, mapData: TileMap.MapData) {
        for (let tileSet of mapData.tileSets) {
            if (!scene.textures.exists(tileSet.image)) {
                let ret = await goLoadImage(tileSet.image);
                if (ret.Error) {
                    popupMsg(ret.Error, "error");
                    return;
                }
    
                let img = await Util.loadImage(ret.Data);
                scene.textures.addImage(tileSet.image, img);
            }
        }
    }
}
