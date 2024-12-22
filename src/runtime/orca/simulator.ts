import { Orca as OrcaAgent } from "./agent";
import { Orca as OrcaKind } from "./kind";
import { Orca as OrcaKdTree } from "./kdTree";

export namespace Orca {
    export class Simulator {
        agents: OrcaAgent.Agent[]
        obstacles: OrcaKind.Obstacle[]
        kdTree: OrcaKdTree.KdTree
        timeStep: number
        globalTime: number

        constructor() {
            this.agents = [];
            this.obstacles = [];
            this.kdTree = new OrcaKdTree.KdTree();
        }

        addAgent(agent: OrcaAgent.Agent): number {
            agent.id = this.agents.length;
            this.agents.push(agent);

            return agent.id;
        }

        addObstacleByPoints(vertices: OrcaKind.Vector2[]): number {
            if (vertices.length < 2) {
                return -1;
            }

            let obstacleNo = this.obstacles.length;
            for (let i = 0; i < vertices.length; ++i) {
                let vertex = vertices[i];

                let obstacle = new OrcaKind.Obstacle();
                obstacle.point = vertex.copy();

                if ( i != 0) {
                    obstacle.prev = this.obstacles[this.obstacles.length - 1];
                    obstacle.prev.next = obstacle;
                }

                if (i == vertices.length - 1) {
                    obstacle.next = this.obstacles[obstacleNo];
                    obstacle.next.prev = obstacle;
                }

                obstacle.dir = vertices[(i == vertices.length - 1 ? 0 : i + 1)].sub(vertex);
                obstacle.dir.normalize(obstacle.dir);

                if (vertices.length == 2) {
                    obstacle.convex = true;
                } else {
                    let prev = vertices[i == 0 ? vertices.length - 1 : i - 1];
                    let next = vertices[i == vertices.length - 1 ? 0 : i + 1];
                    obstacle.convex = OrcaKind.leftOf(prev, vertex, next) >= 0;
                }

                obstacle.id = this.obstacles.length;
                this.obstacles.push(obstacle);
            }

            return obstacleNo;
        }

        stepStart() {
            this.kdTree.buildAgentTree(this);
        }

        stepCompute(start?: number, end?: number) {
            if (start === undefined) {
                start = 0;
            }
            if (end === undefined) {
                end = this.agents.length;
            }

            for (let i = start; i < end; ++i) {
                this.agents[i].computeNeighbors(this.kdTree);
                this.agents[i].computeNewVelocity(this.timeStep);
            }
        }

        stepUpdate(start?: number, end?: number) {
            if (start === undefined) {
                start = 0;
            }
            if (end === undefined) {
                end = this.agents.length;
            }

            for (let i = start; i < end; ++i) {
                this.agents[i].update(this.timeStep);
            }
        }

        getAgents(): OrcaAgent.Agent[] {
            return this.agents;
        }

        getObstacles(): OrcaKind.Obstacle[] {
            return this.obstacles;
        }

        addObstacle(obstacle: OrcaKind.Obstacle) {
            this.obstacles.push(obstacle);
        }

        clear() {
            this.agents = [];
            this.obstacles = [];
            this.kdTree = new OrcaKdTree.KdTree();
            this.globalTime = 0;
            this.timeStep = 0.1;
        }
    }
}