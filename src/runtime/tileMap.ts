import { Scene, Tilemaps, Types, Math as PhaserMath } from "phaser";

export namespace TileMap {
    export class Tile {
        index: number
        rotation: number

        constructor(obj?: any) {
            if (!obj) {
                return;
            }

            this.fromObj(obj);
        }

        fromObj(obj: any) {
            this.index = obj.index;
            if (obj.rotation !== undefined) {
                this.rotation = obj.rotation;
            } else {
                this.rotation = 0;
            }
        }
    }

    class BaseTileLayer {
        name: string
        x: number
        y: number
        width: number
        height: number
        tileWidth: number
        tileHeight: number

        constructor(obj?: any) {
            if (!obj) {
                return;
            }

            this.name = obj.name;
            this.x = obj.x;
            this.y = obj.y;
            this.width = obj.width;
            this.height = obj.height;
            this.tileWidth = obj.tileWidth;
            this.tileHeight = obj.tileHeight;
        }

        toObj(): any {
            return {
                name: this.name,
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                tileWidth: this.tileWidth,
                tileHeight: this.tileHeight,
            };
        }

        getCenterPoint(): PhaserMath.Vector2 {
            let width = this.width * this.tileWidth;
            let height = this.height * this.tileHeight;
            return new PhaserMath.Vector2(this.x + width / 2, this.y + height / 2);
        }

        getArea(): number {
            return this.width * this.tileWidth * this.height * this.tileHeight;
        }
    }

    export class TileLayer extends BaseTileLayer {
        visible: boolean
        depth: number
        alpha: number
        tiles?: Map<string, Tile>

        constructor(obj?: any) {
            super(obj);

            if (!obj) {
                return;
            }

            this.visible = obj.visible;
            this.depth = obj.depth;
            this.alpha = obj.alpha;

            if (obj.tiles) {
                this.tiles = new Map<string, Tile>();
                for (let key in obj.tiles) {
                    this.tiles.set(key, new Tile(obj.tiles[key]));
                }
            }
        }

        toJSON(): any {
            let obj = this.toObj();
            obj.visible = this.visible;
            obj.depth = this.depth;
            obj.alpha = this.alpha;

            if (this.tiles) {
                obj.tiles = Object.fromEntries(this.tiles.entries());
            }

            return obj;
        }
    }

    export class CollisionLayer extends BaseTileLayer {
        enable: boolean
        tiles?: Map<string, number>

        constructor(obj?: any) {
            super(obj);

            if (!obj) {
                return;
            }

            this.enable = obj.enable ? true : false;

            if (!obj.tiles || obj.tiles.length == 0) {
                return;
            }

            this.tiles = new Map<string, number>();
            for (let key in obj.tiles) {
                this.tiles.set(key, obj.tiles[key]);
            }
        }

        isValid(): boolean {
            if (!this.name || !this.tileWidth || !this.tileHeight) {
                return false;
            }

            return true;
        }

        toJSON(): any {
            let obj = this.toObj();
            obj.enable = this.enable;

            if (this.tiles) {
                obj.tiles = Object.fromEntries(this.tiles.entries());
            }

            return obj;
        }
    }

    export class TileSet {
        firstGid: number
        tileWidth: number
        tileHeight: number
        image: string
        imageWidth: number
        imageHeight: number
        total: number

        constructor(obj?: any) {
            if (!obj) {
                return;
            }

            this.fromObj(obj);
        }

        fromObj(obj: any) {
            this.firstGid = obj.firstGid;
            this.tileWidth = obj.tileWidth;
            this.tileHeight = obj.tileHeight;
            this.image = obj.image;
            this.imageWidth = obj.imageWidth;
            this.imageHeight = obj.imageHeight;
            this.total = obj.total;
        }
    }

    export class MapData {
        version: string
        kind: string
        width: number
        height: number
        layers: TileLayer[]
        tileSets: TileSet[]
        collision: CollisionLayer

        constructor(obj?: any) {
            if (!obj) {
                this.collision = new CollisionLayer();
                return;
            }

            this.fromObj(obj);
        }

        fromObj(obj: any) {
            this.version = obj.version;
            this.width = obj.width;
            this.height = obj.height;
            this.kind = "";

            if (obj.layers && obj.layers.length > 0) {
                this.layers = [];
                for (let i = 0; i < obj.layers.length; ++i) {
                    this.layers.push(new TileLayer(obj.layers[i]));
                }
            }

            if (obj.tileSets && obj.tileSets.length > 0) {
                this.tileSets = [];
                for (let i = 0; i < obj.tileSets.length; ++i) {
                    this.tileSets.push(new TileSet(obj.tileSets[i]));
                }
            }

            this.collision = new CollisionLayer(obj.collision);
        }

        getCenterPoint(): PhaserMath.Vector2 {
            if (this.layers.length == 0) {
                return new PhaserMath.Vector2(0, 0);
            }

            let maxArea = this.layers[0].getArea();
            let index = 0;
            for (let i = 1; i < this.layers.length; ++i) {
                let area = this.layers[i].getArea();
                if (area > maxArea) {
                    maxArea = area;
                    index = i;
                }
            }

            return this.layers[index].getCenterPoint();
        }
    }

    export class Loader {
        create(scene: Scene, tileWidth: number, tileHeight: number, width: number, height: number): Tilemaps.Tilemap {
            const config: Types.Tilemaps.TilemapConfig = {
                tileWidth: tileWidth, tileHeight: tileHeight,
                width: width, height: height,
            };
            let map = scene.make.tilemap(config);
            return map;
        }

        setTilesetImage(map: Tilemaps.Tilemap, name: string, firstGid: number | string) {
            if (map.getTileset(name) != null) {
                return;
            }

            if (firstGid == "auto") {
                firstGid = this.getFirstGid(map);
            }

            let tileWidth, tileHeight;
            if (map.layer) {
                tileWidth = map.layer.tileWidth;
                tileHeight = map.layer.tileHeight;
            } else {
                tileWidth = map.tileWidth;
                tileHeight = map.tileHeight;
            }

            map.addTilesetImage(name, name, tileWidth, tileHeight,
                0, 0, firstGid as number);
        }

        load(scene: Scene, mapData: MapData, withCollision: boolean = true): (Tilemaps.Tilemap[] | null) {
            if (mapData.layers.length == 0 || mapData.tileSets.length == 0) {
                return null;
            }

            let map = this.create(scene, mapData.layers[0].tileWidth, mapData.layers[0].tileHeight,
                mapData.width, mapData.height);

            for (let i = 0; i < mapData.tileSets.length; ++i) {
                this.setTilesetImage(map, mapData.tileSets[i].image, mapData.tileSets[i].firstGid);
            }

            for (let i = 0; i < mapData.layers.length; i++) {
                let layerData = mapData.layers[i];
                if (layerData.tiles == null) {
                    continue;
                }

                let layer = map.createBlankLayer(layerData.name, map.tilesets,
                    layerData.x, layerData.y, layerData.width, layerData.height,
                    layerData.tileWidth, layerData.tileHeight);
                if (layer == null) {
                    return null;
                }

                let mapLayer = layer as Tilemaps.TilemapLayer;
                mapLayer.depth = layerData.depth;
                mapLayer.visible = layerData.visible;
                mapLayer.setAlpha(layerData.alpha);

                layerData.tiles.forEach((value: Tile, key: string) => {
                    let arr = key.split("_");
                    let x = parseInt(arr[0]);
                    let y = parseInt(arr[1]);

                    let tile = mapLayer.putTileAt(value.index, x, y);
                    if (value.rotation) {
                        tile.rotation = value.rotation;
                    }
                });
            }

            let ret = [map];

            if (withCollision && mapData.collision) {
                let collisionMap = this.loadCollisionLayer(scene, map, mapData.collision, map.tilesets[0], false);
                if (collisionMap) {
                    ret.push(collisionMap);
                }
            }

            return ret;
        }

        loadCollisionLayer(scene: Scene, map: Tilemaps.Tilemap, collision: CollisionLayer, tileSet: Tilemaps.Tileset, show: boolean): Tilemaps.Tilemap | undefined {
            let collisionMap = this.create(scene, collision.tileWidth, collision.tileHeight,
                collision.width, collision.height);

            collisionMap.addTilesetImage(tileSet.name);

            let maxDepth = 0;
            if (map.layers && map.layers.length > 0) {
                maxDepth = map.layers[0].tilemapLayer.depth;
                for (let i = 1; i < map.layers.length; ++i) {
                    if (maxDepth < map.layers[i].tilemapLayer.depth) {
                        maxDepth = map.layers[i].tilemapLayer.depth;
                    }
                }
            }

            let layer = collisionMap.createBlankLayer(collision.name, tileSet,
                collision.x, collision.y, collision.width, collision.height,
                collision.tileWidth, collision.tileHeight);
            if (layer == null) {
                return undefined;
            }

            let mapLayer = layer as Tilemaps.TilemapLayer;
            if (show) {
                mapLayer.visible = true;
                mapLayer.alpha = 0.5;
            } else {
                mapLayer.visible = false;
            }

            mapLayer.depth = maxDepth + 1;

            if (collision.tiles) {
                collision.tiles.forEach((value: number, key: string) => {
                    let arr = key.split("_");
                    let x = parseInt(arr[0]);
                    let y = parseInt(arr[1]);
    
                    mapLayer.putTileAt(value, x, y);
                });
            }

            mapLayer.setCollisionByExclusion([-1]);

            return collisionMap;
        }

        private getFirstGid(map: Tilemaps.Tilemap) {
            if (!map || map.tilesets.length == 0) {
                return 0;
            }

            let last = map.tilesets[map.tilesets.length - 1];
            return last.firstgid + last.total;
        }
    }
}