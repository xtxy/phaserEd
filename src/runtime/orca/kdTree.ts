import { Orca as OrcaKind } from "./kind";
import { Orca as OrcaAgent } from "./agent";
import { Orca as OrcaMath } from "./math";

export namespace Orca {
    interface Simulator {
        getAgents(): OrcaAgent.Agent[]
        getObstacles(): OrcaKind.Obstacle[]
        addObstacle(obstacle: OrcaKind.Obstacle): void
    }

    class AgentTreeNode {
        begin: number
        end: number
        left: number
        right: number
        maxX: number
        maxY: number
        minX: number
        minY: number
    }

    class ObstacleTreeNode {
        obstacle: OrcaKind.Obstacle
        left: ObstacleTreeNode | null
        right: ObstacleTreeNode | null
    }

    const max_leaf_size = 10;

    export class KdTree {
        agents: OrcaAgent.Agent[]
        agentTree: AgentTreeNode[]
        obstacleTreeNode: ObstacleTreeNode | null

        buildAgentTree(simulator: Simulator) {
            let simAgents = simulator.getAgents();
            if (!this.agents || this.agents.length != simAgents.length) {
                this.agents = [];
                for (let i = 0; i < simAgents.length; i++) {
                    this.agents.push(simAgents[i]);
                }

                this.agentTree = [];
                for (let i = 0; i < simAgents.length; i++) {
                    this.agentTree.push(new AgentTreeNode());
                }
            }

            if (this.agents.length != 0) {

            }
        }

        buildAgentTreeRecursive(begin: number, end: number, index: number) {
            let node = this.agentTree[index];
            node.begin = begin;
            node.end = end;
            node.minX = node.maxX = this.agents[begin].position.x;
            node.minY = node.maxY = this.agents[begin].position.y;

            for (let i = begin + 1; i < end; i++) {
                let agent = this.agents[i];
                if (agent.position.x > node.maxX) {
                    node.maxX = agent.position.x;
                } else if (agent.position.x < node.minX) {
                    node.minX = agent.position.x;
                }

                if (agent.position.y > node.maxY) {
                    node.maxY = agent.position.y;
                } else if (agent.position.y < node.minY) {
                    node.minY = agent.position.y;
                }
            }

            if (end - begin <= max_leaf_size) {
                return;
            }

            let isVertical = node.maxX - node.minX > node.maxY - node.minY;
            let splitValue = 0.5 * (isVertical ? node.maxX + node.minX : node.maxY + node.minY);
            let left = begin;
            let right = end;

            while (left < right) {
                while (left < right && (isVertical ? this.agents[left].position.x : this.agents[left].position.y) < splitValue) {
                    ++left;
                }

                while (right > left && (isVertical ? this.agents[right - 1].position.x : this.agents[right - 1].position.y) >= splitValue) {
                    --right;
                }

                if (left < right) {
                    let tmp = this.agents[left];
                    this.agents[left] = this.agents[right - 1];
                    this.agents[right - 1] = tmp;
                    ++left;
                    --right;
                }
            }

            let leftSize = left - begin;
            if (leftSize == 0) {
                ++leftSize;
                ++left;
            }

            node.left = index + 1;
            node.right = index + 2 * leftSize;

            this.buildAgentTreeRecursive(begin, left, node.left);
            this.buildAgentTreeRecursive(left, end, node.right);
        }

        buildObstacleTree(simulator: Simulator) {
            let obstacles: OrcaKind.Obstacle[] = [];
            let simObstacles = simulator.getObstacles();

            for (let i = 0; i < simObstacles.length; i++) {
                obstacles.push(simObstacles[i]);
            }

            this.obstacleTreeNode = this.buildObstacleTreeRecursive(obstacles, simulator);
        }

        buildObstacleTreeRecursive(obstacles: OrcaKind.Obstacle[], simulator: Simulator): ObstacleTreeNode | null {
            if (obstacles.length == 0) {
                return null;
            }

            let node = new ObstacleTreeNode();
            let optimalSplit = 0;
            let minLeft = obstacles.length;
            let minRight = obstacles.length;

            for (let i = 0; i < obstacles.length; i++) {
                let leftSize = 0;
                let rightSize = 0;

                let obstacleI1 = obstacles[i];
                let obstacleI2 = obstacleI1.next;

                for (let j = 0; j < obstacles.length; j++) {
                    if (i == j) {
                        continue;
                    }

                    let obstacleJ1 = obstacles[j];
                    let obstacleJ2 = obstacleJ1.next;

                    let j1LeftOfI = OrcaKind.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ1.point);
                    let j2LeftOfI = OrcaKind.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ2.point);

                    if (j1LeftOfI >= -OrcaMath.Math.rvo_epsilon && j2LeftOfI >= -OrcaMath.Math.rvo_epsilon) {
                        ++leftSize;
                    } else if (j1LeftOfI <= OrcaMath.Math.rvo_epsilon && j2LeftOfI <= OrcaMath.Math.rvo_epsilon) {
                        ++rightSize;
                    } else {
                        ++leftSize;
                        ++rightSize;
                    }

                    if (!this.rangeLt(leftSize, rightSize, minLeft, minRight)) {
                        break;
                    }
                }

                if (this.rangeLt(leftSize, rightSize, minLeft, minRight)) {
                    minLeft = leftSize;
                    minRight = rightSize;
                    optimalSplit = i;
                }
            }

            let leftObstacles = new Array<OrcaKind.Obstacle>(minLeft);
            let rightObstacles = new Array<OrcaKind.Obstacle>(minRight);

            let leftCounter = 0;
            let rightCounter = 0;
            let i = optimalSplit;
            let obstacleI1 = obstacles[i];
            let obstacleI2 = obstacleI1.next;

            for (let j = 0; j < obstacles.length; ++j) {
                if (i == j) {
                    continue;
                }

                let obstacleJ1 = obstacles[j];
                let obstacleJ2 = obstacleJ1.next;

                let j1LeftOfI = OrcaKind.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ1.point);
                let j2LeftOfI = OrcaKind.leftOf(obstacleI1.point, obstacleI2.point, obstacleJ2.point);

                if (j1LeftOfI >= -OrcaMath.Math.rvo_epsilon && j2LeftOfI >= -OrcaMath.Math.rvo_epsilon) {
                    leftObstacles[leftCounter++] = obstacles[j];
                    continue;
                } else if (j1LeftOfI <= OrcaMath.Math.rvo_epsilon && j2LeftOfI <= OrcaMath.Math.rvo_epsilon) {
                    rightObstacles[rightCounter++] = obstacles[j];
                    continue;
                }

                let x1 = obstacleI2.point.x - obstacleI1.point.x;
                let y1 = obstacleI2.point.y - obstacleI1.point.y;
                let x2 = obstacleJ1.point.x - obstacleI1.point.x;
                let y2 = obstacleJ1.point.y - obstacleI1.point.y;
                let x3 = obstacleJ1.point.x - obstacleJ2.point.x;
                let y3 = obstacleJ1.point.y - obstacleJ2.point.y;

                let t = OrcaMath.Math.det(x1, y1, x2, y2) / OrcaMath.Math.det(x1, y1, x3, y3);
                let splitX = obstacleJ1.point.x + t * (obstacleJ2.point.x - obstacleJ1.point.x);
                let splitY = obstacleJ1.point.y + t * (obstacleJ2.point.y - obstacleJ1.point.y);

                let newObstacle = new OrcaKind.Obstacle();
                newObstacle.point = new OrcaKind.Vector2(splitX, splitY);
                newObstacle.prev = obstacleJ1;
                newObstacle.next = obstacleJ2;
                newObstacle.convex = true;
                newObstacle.dir = obstacleJ1.dir.copy();
                newObstacle.id = simulator.getObstacles().length;

                simulator.addObstacle(newObstacle);

                obstacleJ1.next = newObstacle;
                obstacleJ2.prev = newObstacle;

                if (j1LeftOfI > 0) {
                    leftObstacles[leftCounter++] = obstacleJ1;
                    rightObstacles[rightCounter++] = newObstacle;
                } else {
                    rightObstacles[rightCounter++] = obstacleJ1;
                    leftObstacles[leftCounter++] = newObstacle;
                }
            }

            node.obstacle = obstacleI1;
            node.left = this.buildObstacleTreeRecursive(leftObstacles, simulator);
            node.right = this.buildObstacleTreeRecursive(rightObstacles, simulator);

            return node;
        }

        computeAgentNeighbors(agent: OrcaAgent.Agent, rangeSq: number): number {
            return this.queryAgentTreeRecursive(agent, rangeSq, 0);
        }

        computeObstacleNeighbors(agent: OrcaAgent.Agent, rangeSq: number) {
            this.queryObstacleTreeRecursive(agent, rangeSq, this.obstacleTreeNode);
        }

        queryAgentTreeRecursive(agent: OrcaAgent.Agent, rangeSq: number, index: number): number {
            let node = this.agentTree[index];
            if (node.end - node.begin <= max_leaf_size) {
                for (let i = node.begin; i < node.end; ++i) {
                    rangeSq = agent.insertAgentNeighbor(this.agents[i], rangeSq);
                }

                return rangeSq;
            }

            let nodeLeft = this.agentTree[node.left];
            let distSqLeft = OrcaMath.Math.sqr(Math.max(0, nodeLeft.minX - agent.position.x)) +
                OrcaMath.Math.sqr(Math.max(0, agent.position.x - nodeLeft.maxX)) +
                OrcaMath.Math.sqr(Math.max(0, nodeLeft.minY - agent.position.y)) +
                OrcaMath.Math.sqr(Math.max(0, agent.position.y - nodeLeft.maxY));

            let nodeRight = this.agentTree[node.right];
            let distSqRight = OrcaMath.Math.sqr(Math.max(0, nodeRight.minX - agent.position.x)) +
                OrcaMath.Math.sqr(Math.max(0, agent.position.x - nodeRight.maxX)) +
                OrcaMath.Math.sqr(Math.max(0, nodeRight.minY - agent.position.y)) +
                OrcaMath.Math.sqr(Math.max(0, agent.position.y - nodeRight.maxY));

            if (distSqLeft < distSqRight) {
                if (distSqLeft < rangeSq) {
                    rangeSq = this.queryAgentTreeRecursive(agent, rangeSq, node.left);
                    if (distSqRight < rangeSq) {
                        rangeSq = this.queryAgentTreeRecursive(agent, rangeSq, node.right);
                    }
                }
            } else {
                if (distSqRight < rangeSq) {
                    rangeSq = this.queryAgentTreeRecursive(agent, rangeSq, node.right);
                    if (distSqLeft < rangeSq) {
                        rangeSq = this.queryAgentTreeRecursive(agent, rangeSq, node.left);
                    }
                }
            }

            return rangeSq;
        }

        queryObstacleTreeRecursive(agent: OrcaAgent.Agent, rangeSq: number, node: ObstacleTreeNode | null) {
            if (!node) {
                return;
            }

            let obstacle1 = node.obstacle;
            let obstacle2 = obstacle1.next;

            let agentLeftOfLine = OrcaKind.leftOf(obstacle1.point, obstacle2.point, agent.position);
            this.queryObstacleTreeRecursive(agent, rangeSq, agentLeftOfLine >= 0 ? node.left : node.right);

            let distSqLine = OrcaMath.Math.sqr(agentLeftOfLine) / OrcaMath.Math.absSq(obstacle2.point.x - obstacle1.point.x, obstacle2.point.y - obstacle1.point.y);
            if (distSqLine >= rangeSq) {
                return;
            }

            if (agentLeftOfLine < 0) {
                agent.insertObstacleNeighbor(node.obstacle, rangeSq);
            }

            this.queryObstacleTreeRecursive(agent, rangeSq, agentLeftOfLine >= 0 ? node.right : node.left);
        }

        queryVisibility(q1: OrcaKind.Vector2, q2: OrcaKind.Vector2, radius: number) {
            return this.queryVisibilityRecursive(q1, q2, radius, this.obstacleTreeNode);
        }

        queryVisibilityRecursive(q1: OrcaKind.Vector2, q2: OrcaKind.Vector2, radius: number, node: ObstacleTreeNode | null): boolean {
            if (!node) {
                return true;
            }

            let obstacle1 = node.obstacle;
            let obstacle2 = obstacle1.next;

            let q1leftOfI = OrcaKind.leftOf(obstacle1.point, obstacle2.point, q1);
            let q2leftOfI = OrcaKind.leftOf(obstacle1.point, obstacle2.point, q2);
            let invLengthI = 1 / OrcaMath.Math.absSq(obstacle2.point.x - obstacle1.point.x, obstacle2.point.y - obstacle1.point.y);

            if (q1leftOfI >= 0 && q2leftOfI >= 0) {
                if (this.queryVisibilityRecursive(q1, q2, radius, node.left)) {
                    let radiusSqr = OrcaMath.Math.sqr(radius);
                    return OrcaMath.Math.sqr(q1leftOfI) * invLengthI >= radiusSqr && OrcaMath.Math.sqr(q2leftOfI) * invLengthI >= radiusSqr;
                } else {
                    return this.queryVisibilityRecursive(q1, q2, radius, node.right);
                }
            }

            if (q1leftOfI <= 0 && q2leftOfI <= 0) {
                if (this.queryVisibilityRecursive(q1, q2, radius, node.right)) {
                    let radiusSqr = OrcaMath.Math.sqr(radius);
                    return OrcaMath.Math.sqr(q1leftOfI) * invLengthI >= radiusSqr && OrcaMath.Math.sqr(q2leftOfI) * invLengthI >= radiusSqr;
                } else {
                    return this.queryVisibilityRecursive(q1, q2, radius, node.left);
                }
            }

            if (q1leftOfI >= 0 && q2leftOfI <= 0) {
                return this.queryVisibilityRecursive(q1, q2, radius, node.left) && this.queryVisibilityRecursive(q1, q2, radius, node.right);
            }

            let point1LeftOfQ = OrcaKind.leftOf(q1, q2, obstacle1.point);
            let point2LeftOfQ = OrcaKind.leftOf(q1, q2, obstacle2.point);
            let invLengthQ = 1 / OrcaMath.Math.absSq(q2.x - q1.x, q2.y - q1.y);
            let radiusSqr = OrcaMath.Math.sqr(radius);

            return point1LeftOfQ * point2LeftOfQ >= 0 &&
                OrcaMath.Math.sqr(point1LeftOfQ) * invLengthQ > radiusSqr &&
                OrcaMath.Math.sqr(point2LeftOfQ) * invLengthQ > radiusSqr &&
                this.queryVisibilityRecursive(q1, q2, radius, node.left) &&
                this.queryVisibilityRecursive(q1, q2, radius, node.right);
        }

        rangeLt(a1: number, a2: number, b1: number, b2: number): boolean {
            let max1: number;
            let min1: number;
            let max2: number;
            let min2: number;

            if (a1 > a2) {
                max1 = a1;
                min1 = a2;
            } else {
                max1 = a2;
                min1 = a1;
            }

            if (b1 > b2) {
                max2 = b1;
                min2 = b2;
            } else {
                max2 = b2;
                min2 = b1;
            }

            return max1 < max2 || max1 == max2 && min1 < min2;
        }
    }
}