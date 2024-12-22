import { GameObjects, Geom, Scene } from "phaser";

export class SceneGrid {
    private scene: Scene
    private depth: number
    private color: number
    private alpha: number
    private tileWidth: number
    private tileHeight: number
    private rect: Geom.Rectangle
    private grid?: GameObjects.Grid

    constructor(scene: Scene, depth: number, color: number, alpha: number) {
        this.scene = scene;
        this.depth = depth;
        this.color = color;
        this.alpha = alpha;
        this.tileWidth = 0;
        this.tileHeight = 0;
        this.rect = new Geom.Rectangle();
    }

    draw(tileWidth: number, tileHeight: number, force: boolean) {
        if (tileWidth != this.tileWidth || tileHeight != this.tileHeight) {
            this.tileWidth = tileWidth;
            this.tileHeight = tileHeight;
            force = true;
        }

        this.getGridInfo();

        if (force) {
            if (this.grid) {
                this.grid.destroy();
                this.grid = undefined;
            }

            this.create();
        } else if (!this.grid) {
            this.create();
        } else {
            this.moveGrid();
        }
    }

    show(visible: boolean) {
        if (this.grid) {
            this.grid.visible = visible;
        }
    }

    private getGridInfo() {
        let rect = this.scene.cameras.main.worldView;

        let startIndex = Math.floor(rect.x / this.tileWidth) - 1;
        if (rect.x < 0) {
            startIndex--;
        }
        let x = startIndex * this.tileWidth;

        startIndex = Math.floor(rect.y / this.tileHeight) - 1;
        if (rect.y < 0) {
            startIndex--;
        }
        let y = startIndex * this.tileHeight;

        let xCount = Math.floor(rect.width / this.tileWidth) + 2;
        let yCount = Math.floor(rect.height / this.tileHeight) + 2;

        this.rect.x = x + this.tileWidth * xCount / 2;
        this.rect.y = y + this.tileHeight * yCount / 2;
        this.rect.width = xCount * this.tileWidth;
        this.rect.height = yCount * this.tileHeight;
    }

    private create() {
        this.grid = this.scene.add.grid(this.rect.x, this.rect.y, this.rect.width, this.rect.height,
            this.tileWidth, this.tileHeight, 0, 0, this.color, this.alpha);
        this.grid.depth = this.depth;
    }

    private moveGrid() {
        if (!this.grid) {
            return;
        }

        this.grid.x = this.rect.x;
        this.grid.y = this.rect.y;
        this.grid.width = this.rect.width;
        this.grid.height = this.rect.height;
    }
}