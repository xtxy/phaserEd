export namespace Runtime {
    export namespace PathFind {
        export class FlowFieldNode {
            x: number
            y: number
            cost: number
            localCost: number
            dir: number

            constructor(x: number, y: number, localCost: number) {
                this.x = x;
                this.y = y;
                this.localCost = localCost;
                this.cost = -1;
                this.dir = -1;
            }
        }

        class FlowFieldNeighbor {
            x: number
            y: number
            rely?: number[]
        }

        export class FlowField {
            nodes: Map<string, FlowFieldNode>
            neighbors: FlowFieldNeighbor[]

            constructor() {
                this.nodes = new Map<string, FlowFieldNode>();
                this.neighbors = [
                    { x: 0, y: -1 },
                    { x: 0, y: 1 },
                    { x: -1, y: 0 },
                    { x: 1, y: 0 },
                    { x: -1, y: -1, rely: [0, 2] },
                    { x: 1, y: -1, rely: [0, 3] },
                    { x: -1, y: 1, rely: [1, 2] },
                    { x: 1, y: 1, rely: [1, 3] },
                ];
            }

            addNode(x: number, y: number, localCost: number) {
                let key = this.getKey(x, y);
                let node = new FlowFieldNode(x, y, localCost);
                this.nodes.set(key, node);
            }

            delNode(x: number, y: number) {
                let key = this.getKey(x, y);
                this.nodes.delete(key);
            }

            createFlowField(x: number, y: number): boolean {
                let key = this.getKey(x, y);
                let node = this.nodes.get(key);
                if (!node) {
                    return false;
                }

                this.reset();

                node.cost = 0;

                this.createHeatmap(node);
                this.createDirField(node);

                return true;
            }

            createHeatmap(target: FlowFieldNode) {
                let nodes = [target];
                let newNodes: FlowFieldNode[] = [];

                while (nodes.length > 0) {
                    for (let i = 0; i < nodes.length; i++) {
                        let node = nodes[i];
                        let neightbors = this.getNeighbors(node.x, node.y);

                        for (let k = 0; k < 8; k++) {
                            let neighbor = neightbors.get(k);
                            if (!neighbor || neighbor.cost >= 0) {
                                continue;
                            }

                            let deltaCost = k < 4 ? 10 : 14;
                            neighbor.cost = node.cost + deltaCost;
                            newNodes.push(neighbor);
                        }
                    }

                    nodes = newNodes;
                    newNodes = [];
                }
            }

            createDirField(target: FlowFieldNode) {
                let nodes = [target];
                let newNodes: FlowFieldNode[] = [];

                while (nodes.length > 0) {
                    for (let i = 0; i < nodes.length; i++) {
                        let node = nodes[i];
                        let neighbors = this.getNeighbors(node.x, node.y);

                        let minCost = 0;
                        neighbors.forEach((neighbor: FlowFieldNode, key: number) => {
                            let neighborCost = neighbor.cost + neighbor.localCost;
                            if (node.dir < 0 || neighborCost < minCost) {
                                minCost = neighborCost;
                                node.dir = key;
                            }

                            if (neighbor.dir < 0) {
                                newNodes.push(neighbor);
                            }
                        });
                    }

                    nodes = newNodes;
                    newNodes = [];
                }
            }

            reset() {
                this.nodes.forEach((value: FlowFieldNode) => {
                    value.cost = -1;
                    value.dir = -1;
                })
            }

            getNeighbors(x: number, y: number): Map<number, FlowFieldNode> {
                let neighbors = new Map<number, FlowFieldNode>();

                for (let i = 0; i < this.neighbors.length; i++) {
                    let neighbor = this.neighbors[i];
                    if (neighbor.rely) {
                        let relyOk = true;
                        for (let j = 0; j < neighbor.rely.length; j++) {
                            if (!neighbors.get(neighbor.rely[j])) {
                                relyOk = false;
                                break;
                            }
                        }

                        if (!relyOk) {
                            continue;
                        }
                    }

                    let key = this.getKey(neighbor.x + x, neighbor.y + y);
                    let node = this.nodes.get(key);
                    if (node) {
                        neighbors.set(i, node);
                    }
                }

                return neighbors;
            }

            getKey(x: number, y: number): string {
                return x + "_" + y;
            }
        }
    }
}