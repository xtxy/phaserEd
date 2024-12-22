import { GameObjects, Input, Scene, Math as PhaserMath } from "phaser";
import { DragRect, SelectRects } from "./rect";
import { isClick } from "../util/util";
import { Util } from "../runtime/util";
import { TileMapBrushTile } from "../model/tileMap";

const map_pic_key = "mapPic";

export class TileSetScene extends Scene {
    private shiftKey: Input.Keyboard.Key
    private ctrlKey: Input.Keyboard.Key
    private dragRect: DragRect
    private selectRects: SelectRects
    private image?: GameObjects.Image
    private downX: number
    private downY: number
    private cameraX: number
    private cameraY: number
    private cameraMoving: boolean
    private lastUpX: number
    private lastUpY: number
    private lastUpValid: boolean
    private tileWidth: number
    private tileHeight: number
    private mapInterval: number
    private imageWidth: number
    private imageHeight: number
    private worldPoint: PhaserMath.Vector2

    pointerMoveCallback?: (x: number, y: number) => void;
    loadMapDoneCallback?: () => void;

    create() {
        this.input.mouse?.disableContextMenu();
        if (this.input.keyboard) {
            this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false);
            this.ctrlKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL, false);
        }

        this.dragRect = new DragRect(this, 0x0000aa, 0.5, 100);
        this.selectRects = new SelectRects(this, "selectRect", 99, 0xffffff, 0xff0000, 0.5);

        this.game.canvas.addEventListener('mouseleave', () => {
            this.lastUpValid = false;
        });

        this.input.on('pointerdown', (pointer: Input.Pointer) => {
            if (!this.image) {
                return;
            }

            this.downX = pointer.x;
            this.downY = pointer.y;

            if (pointer.rightButtonDown()) {
                this.cameraX = this.cameras.main.scrollX;
                this.cameraY = this.cameras.main.scrollY;
                this.cameraMoving = true;
            } else {
                this.cameraMoving = false;
            }
        });

        this.input.on('pointerup', (pointer: Input.Pointer) => {
            if (!this.image || this.cameraMoving) {
                return;
            }

            let downX = this.downX;
            let downY = this.downY;

            this.dragRect.clear();

            if (!this.ctrlKey.isDown) {
                this.clearSelects(false);
            }

            if (this.shiftKey.isDown && this.lastUpValid) {
                downX = this.lastUpX;
                downY = this.lastUpY;
            } else {
                this.lastUpX = pointer.x;
                this.lastUpY = pointer.y;
                this.lastUpValid = true;
            }

            this.selectRects.add(downX, downY, pointer.x, pointer.y, 
                this.tileWidth + this.mapInterval, this.tileHeight + this.mapInterval,
                this.imageWidth);
        });

        this.input.on('pointermove', (pointer: Input.Pointer) => {
            let x = pointer.x;
            let y = pointer.y;

            if (this.image && pointer.isDown) {
                if (this.cameraMoving) {
                    let newX = this.cameraX + this.downX - x;
                    let newY = this.cameraY + this.downY - y;
                    this.cameras.main.setScroll(newX, newY);
                } else {
                    if (!isClick(this.downX, this.downY, x, y)) {
                        this.dragRect.draw(this.downX, this.downY, x, y);
                    }
                }
            }

            if (this.pointerMoveCallback) {
                this.cameras.main.getWorldPoint(x, y, this.worldPoint);
                this.pointerMoveCallback(this.worldPoint.x, this.worldPoint.y);
            }
        });
    }

    clearSelects(clearLast: boolean) {
        if (!this.image) {
            return;
        }

        if (clearLast) {
            this.lastUpValid = false;
        }

        this.selectRects.clear();
    }

    async loadMapPic(picData: string, interval: number, tileWidth: number, tileHeight: number) {
        this.mapInterval = interval;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        if (this.textures.exists(map_pic_key)) {
            this.textures.remove(map_pic_key);
        }

        if (this.image) {
            this.image.destroy(true);
        }

        let img = await Util.loadImage(picData);;
        this.textures.addImage(map_pic_key, img);

        this.imageWidth = img.width;
        this.imageHeight = img.height;
        this.image = this.add.image(this.imageWidth / 2, this.imageHeight / 2, map_pic_key);
        this.image.depth = 0;

        this.cameras.main.setBounds(0, 0, img.width, img.height);

        tileWidth = this.tileWidth + this.mapInterval;
        let maxXIndex = Math.floor((this.imageWidth - 1) / tileWidth);

        tileHeight = this.tileHeight + this.mapInterval;
        let maxYIndex = Math.floor((this.imageHeight - 1) / tileHeight);

        this.selectRects.setLimit(0, 0, maxXIndex, maxYIndex);

        if (this.loadMapDoneCallback) {
            this.loadMapDoneCallback();
        }
    }

    scaleMap(value: number) {
        if (!this.image) {
            return;
        }

        this.cameras.main.zoom = value;
    }

    getSelects(): TileMapBrushTile[] {
        this.lastUpValid = false;
        return this.selectRects.get();
    }
}