import { Math, Scene } from "phaser";
import { Scene as SceneNode } from "./scene";

export namespace UI {
    export enum AnchorKind {
        Center,
        Up,
        RightUp,
        Right,
        RightDown,
        Down,
        LeftDown,
        Left,
        LeftUp,
    }

    export enum OffsetKind {
        Pixel,
        Percent,
    }

    export class Layout {
        anchor: AnchorKind
        offsetKind: OffsetKind
        offset: Phaser.Math.Vector2

        constructor(obj?: any, load: boolean = false) {
            if (!obj) {
                this.anchor = AnchorKind.Center;
                this.offsetKind = OffsetKind.Pixel;
                this.offset = new Phaser.Math.Vector2(0, 0);
                return;
            }

            if (load) {
                this.anchor = obj.anchor;
                this.offsetKind = obj.offsetKind;
            } else {
                this.setAnchorByString(obj.anchor);
                this.setOffsetKindByString(obj.offsetKind);
            }
            

            let x = 0;
            let y = 0;
            if (obj.offset) {
                if (!isNaN(obj.offset.x)) {
                    x = obj.offset.x;
                }

                if (!isNaN(obj.offset.y)) {
                    y = obj.offset.y;
                }
            }

            this.offset = new Phaser.Math.Vector2(x, y);
        }

        setAnchorByString(str: string) {
            switch (str) {
                case "up":
                    this.anchor = AnchorKind.Up;
                    break;

                case "rightUp":
                    this.anchor = AnchorKind.RightUp;
                    break;

                case "right":
                    this.anchor = AnchorKind.Right;
                    break;

                case "rightDown":
                    this.anchor = AnchorKind.RightDown;
                    break;

                case "down":
                    this.anchor = AnchorKind.Down;
                    break;

                case "leftDown":
                    this.anchor = AnchorKind.LeftDown;
                    break;

                case "left":
                    this.anchor = AnchorKind.Left;
                    break;

                case "leftUp":
                    this.anchor = AnchorKind.LeftUp;
                    break;

                default:
                    this.anchor = AnchorKind.Center;
                    break;
            }
        }

        setOffsetKindByString(str: string) {
            switch (str) {
                case "percent":
                    this.offsetKind = OffsetKind.Percent;
                    break;

                default:
                    this.offsetKind = OffsetKind.Pixel;
                    break;
            }
        }

        getAnchorString(): string {
            switch (this.anchor) {
                case AnchorKind.Up:
                    return "up";

                case AnchorKind.RightUp:
                    return "rightUp";

                case AnchorKind.Right:
                    return "right";

                case AnchorKind.RightDown:
                    return "rightDown";

                case AnchorKind.Down:
                    return "down";

                case AnchorKind.LeftDown:
                    return "leftDown";

                case AnchorKind.Left:
                    return "left";

                case AnchorKind.LeftUp:
                    return "leftUp";
            }

            return "center";
        }

        getOffsetKindString(): string {
            if (this.offsetKind == OffsetKind.Pixel) {
                return "pixel";
            }

            return "percent";
        }

        set(layout: Layout): boolean {
            let change = false;
            if (this.anchor != layout.anchor) {
                this.anchor = layout.anchor;
                change = true;
            }
            if (this.offsetKind != layout.offsetKind) {
                this.offsetKind = layout.offsetKind;
                change = true;
            }
            if (this.offset.x != layout.offset.x) {
                this.offset.x = layout.offset.x;
                change = true;
            }
            if (this.offset.y != layout.offset.y) {
                this.offset.y = layout.offset.y;
                change = true;
            }

            return change;
        }

        getTransform(scene: Scene, pos?: Math.Vector2 | Math.Vector3): Math.Vector2 | Math.Vector3 {
            let rect = scene.cameras.main.worldView;
            if (!pos) {
                pos = new Math.Vector2();
            }

            pos.x = rect.centerX;
            pos.y = rect.centerY;

            switch (this.anchor) {
                case AnchorKind.Up:
                    pos.y = 0;
                    break;

                case AnchorKind.RightUp:
                    pos.x = rect.width;
                    pos.y = 0;
                    break;

                case AnchorKind.Right:
                    pos.x = rect.width;
                    break;

                case AnchorKind.RightDown:
                    pos.x = rect.width;
                    pos.y = rect.height;
                    break;

                case AnchorKind.Down:
                    pos.y = rect.height;
                    break;

                case AnchorKind.LeftDown:
                    pos.x = 0;
                    pos.y = rect.height;
                    break;

                case AnchorKind.Left:
                    pos.x = 0;
                    break;

                case AnchorKind.LeftUp:
                    pos.x = 0;
                    pos.y = 0;
                    break;
            }

            switch (this.offsetKind) {
                case OffsetKind.Pixel:
                    pos.x += this.offset.x;
                    pos.y += this.offset.y;
                    break;

                case OffsetKind.Percent:
                    pos.x += rect.width * this.offset.x / 100;
                    pos.y += rect.height * this.offset.y / 100;
                    break;
            }

            return pos;
        }

        setByTransform(scene: Scene, pos: Math.Vector2 | Math.Vector3) {
            let rect = scene.cameras.main.worldView;
            let x = rect.centerX;
            let y = rect.centerY;

            switch (this.anchor) {
                case AnchorKind.Up:
                    y = 0;
                    break;

                case AnchorKind.RightUp:
                    x = rect.width;
                    y = 0;
                    break;

                case AnchorKind.Right:
                    x = rect.width;
                    break;

                case AnchorKind.RightDown:
                    x = rect.width;
                    y = rect.height;
                    break;

                case AnchorKind.Down:
                    y = rect.height;
                    break;

                case AnchorKind.LeftDown:
                    x = 0;
                    y = rect.height;
                    break;

                case AnchorKind.Left:
                    x = 0;
                    break;

                case AnchorKind.LeftUp:
                    x = 0;
                    y = 0;
                    break;
            }

            switch (this.offsetKind) {
                case OffsetKind.Pixel:
                    this.offset.x = pos.x - x;
                    this.offset.y = pos.y - y;
                    break;

                case OffsetKind.Percent:
                    this.offset.x = (pos.x - x) * 100 / rect.width;
                    this.offset.y = (pos.y - y) * 100 / rect.height;
                    break;
            }
        }
    }
}
