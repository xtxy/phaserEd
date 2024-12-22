import { nanoid } from "nanoid";

export namespace Util {
    export async function loadImage(source: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function () {
                reject(new Error(`Failed to load image from source: ${source}`));
            };
            img.src = source;
        });
    }

    export function roundNum(num: number, min: number, max: number): number {
        if (num < min) {
            let delta = max - min;
            while (num < min) {
                num += delta;
            }
        } else if (num > max) {
            let delta = max - min;
            while (num > max) {
                num -= delta;
            }
        }

        return num;
    }

    export function treeNodeFindByPath(rootArr: any[], pathArr: number[] | null, getChildren: string | ((node: any) => any[] | null)): any {
        if (!pathArr || pathArr.length == 0) {
            return null;
        }

        let node = null;
        let nodeArr = rootArr;
        for (let i = 0; i < pathArr.length; i++) {
            node = nodeArr[pathArr[i]];
            let children: any[] | null;
            if (typeof (getChildren) === "string") {
                children = node[getChildren];
            } else {
                children = getChildren(node);
            }

            if (!children) {
                return null;
            }

            nodeArr = children;
        }

        return node;
    }

    export function treeNodeDel(children: any[], node: any) {
        for (let i = 0; i < children.length; i++) {
            if (children[i] == node) {
                children.splice(i, 1);
                break;
            }
        }
    }

    export function treeNodeDelByPath(rootArr: any[], pathArr: number[], getChildren: string | ((node: any) => any[] | null)): any {
        let parentArr = pathArr.slice(0, pathArr.length - 1);
        let parent = treeNodeFindByPath(rootArr, parentArr, getChildren);

        let children: any[]
        if (parent) {
            let childrenArr: any[] | null;
            if (typeof (getChildren) === "string") {
                childrenArr = parent[getChildren];
            } else {
                childrenArr = getChildren(parent);
            }

            if (!childrenArr) {
                return null;
            }

            children = childrenArr;
        } else {
            children = rootArr;
        }

        let index = pathArr[pathArr.length - 1];
        let node = children[index];
        children.splice(index, 1);
        return node;
    }

    export function treeNodeGetPath(node: any, getChildren: string | ((node: any) => any[] | null),
        getParent: string | ((node: any) => any), rootArr?: any[]): number[] {
        let path: number[] = [];
        let realGetParent: (node: any) => any;
        if (typeof (getParent) === "string") {
            realGetParent = (node: any) => {
                return node[getParent];
            };
        } else {
            realGetParent = getParent;
        }

        for (let parent = realGetParent(node); parent; parent = realGetParent(node)) {
            let children: any[] | null;
            if (typeof (getChildren) === "string") {
                children = parent[getChildren];
            } else {
                children = getChildren(parent);
            }

            if (!children) {
                return [];
            }

            for (let i = 0; i < children.length; ++i) {
                if (children[i] == node) {
                    path.unshift(i);
                    break;
                }
            }

            node = parent;
        }

        if (rootArr && rootArr.length > 0) {
            for (let i = 0; i < rootArr.length; ++i) {
                if (rootArr[i] == node) {
                    path.unshift(i);
                    break;
                }
            }
        }

        return path;
    }

    export async function treeNodeEachByBreath(nodes: any[], callback: (parentPath: number[], node: any) => boolean | Promise<boolean>,
        getChildren: string | ((node: any) => any[] | null)) {
        type nodeInfo = {
            parentStr: string
            children: any[],
        }

        let arr: nodeInfo[] = [{ parentStr: "", children: nodes }];

        while (arr.length > 0) {
            let newArr: nodeInfo[] = [];

            for (let i = 0; i < arr.length; ++i) {
                let parentPath: number[] = [];

                if (arr[i].parentStr) {
                    let parents = arr[i].parentStr.split("|");
                    for (let j = 0; j < parents.length; ++j) {
                        if (parents[j]) {
                            let index = parseInt(parents[j]);
                            if (!isNaN(index)) {
                                parentPath.push(index);
                            }
                        }
                    }
                }

                for (let j = 0; j < arr[i].children.length; ++j) {
                    let ret = callback(parentPath, arr[i].children[j]);
                    if (ret instanceof Promise) {
                        let ok = await ret;
                        if (!ok) {
                            return;
                        }
                    } else if (!ret) {
                        return;
                    }

                    let children: any[] | null;
                    if (typeof (getChildren) === "string") {
                        children = arr[i].children[j][getChildren];
                    } else {
                        children = getChildren(arr[i].children[j]);
                    }

                    if (children && children.length > 0) {
                        let parentStr: string;
                        if (nodes[i].parentStr == "") {
                            parentStr = j.toString();
                        } else {
                            parentStr = nodes[i].parentStr + "|" + j.toString();
                        }

                        newArr.push({
                            parentStr: parentStr, children: children,
                        });
                    }
                }
            }

            arr = newArr;
        }
    }

    export function getUuid(): string {
        return nanoid();
    }
}