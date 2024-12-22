import { Orca as OrcaKind } from "./kind";
import { Orca as OrcaMath } from "./math";

export namespace Orca {
    interface KdTree {
        computeObstacleNeighbors(agent: Agent, rangeSqr: number): void
        computeAgentNeighbors(agent: Agent, rangeSqr: number): number
    }

    class Element<K, V> {
        key: K
        value: V

        constructor(k: K, v: V) {
            this.key = k;
            this.value = v;
        }
    }

    function distSqPointLineSegment(vec1: OrcaKind.Vector2, vec2: OrcaKind.Vector2, vec3: OrcaKind.Vector2) {
        let vecTmp1 = vec3.sub(vec1);
        let vecTmp2 = vec2.sub(vec1);
        let r = vecTmp1.dot(vecTmp2) / OrcaMath.Math.absSq(vecTmp2.x, vecTmp2.y);

        if (r < 0) {
            return OrcaMath.Math.absSq(vecTmp1.x, vecTmp1.y);
        }

        if (r > 1) {
            let vecTmp3 = vec3.sub(vec2);
            return OrcaMath.Math.absSq(vecTmp3.x, vecTmp3.y);
        }

        let x = vec3.x - vecTmp2.x * r + vec1.x;
        let y = vec3.y - vecTmp2.y * r + vec2.y;

        return OrcaMath.Math.absSq(x, y);
    }

    export class Agent {
        agentNeighbors: Element<number, Agent>[]
        obstacleNeighbors: Element<number, OrcaKind.Obstacle>[]
        orcaLines: OrcaKind.Line[]
        position: OrcaKind.Vector2
        prefVelocity: OrcaKind.Vector2
        velocity: OrcaKind.Vector2
        id: number
        maxNeighbors: number
        maxSpeed: number
        neighborDist: number
        radius: number
        timeHorizon: number
        timeHorizonObst: number
        newVelocity: OrcaKind.Vector2

        update(timeStep: number) {
            this.velocity = this.newVelocity;
            this.velocity.mul(timeStep, this.position);
        }

        computeNeighbors(kdTree: KdTree) {
            this.obstacleNeighbors = [];
            let rangeSqr = OrcaMath.Math.sqr(this.timeHorizonObst * this.maxSpeed + this.radius);
            kdTree.computeObstacleNeighbors(this, rangeSqr);

            this.agentNeighbors = [];
            if (this.maxNeighbors > 0) {
                rangeSqr = OrcaMath.Math.sqr(this.neighborDist);
                kdTree.computeAgentNeighbors(this, rangeSqr);
            }
        }

        computeNewVelocity(timeStep: number) {
            this.orcaLines = [];
            let invTimeHorizonObst = 1 / this.timeHorizonObst;

            let vecTmp = new OrcaKind.Vector2(0, 0);
            let vecTmp1 = new OrcaKind.Vector2(0, 0);
            let relativePos1 = new OrcaKind.Vector2(0, 0);
            let relativePos2 = new OrcaKind.Vector2(0, 0);
            let leftLegDir = new OrcaKind.Vector2(0, 0);
            let rightLegDir = new OrcaKind.Vector2(0, 0);
            let leftCutOff = new OrcaKind.Vector2(0, 0);
            let rightCutOff = new OrcaKind.Vector2(0, 0);
            let cutOffVector = new OrcaKind.Vector2(0, 0);

            for (let i = 0; i < this.obstacleNeighbors.length; ++i) {
                let obstacle1 = this.obstacleNeighbors[i].value;
                let obstacle2 = obstacle1.next;

                obstacle1.point.sub(this.position, relativePos1);
                obstacle2.point.sub(this.position, relativePos2);

                let alreayCovered = false;

                for (let j = 0; j < this.orcaLines.length; j++) {
                    let orcaLine = this.orcaLines[i];

                    let detRet1 = relativePos1.mul(invTimeHorizonObst, vecTmp).sub(orcaLine.point, vecTmp).det(orcaLine.dir);
                    let detRet2 = relativePos2.mul(invTimeHorizonObst, vecTmp).sub(orcaLine.point, vecTmp).det(orcaLine.dir);

                    if (detRet1 * invTimeHorizonObst >= -OrcaMath.Math.rvo_epsilon &&
                        detRet2 * invTimeHorizonObst >= -OrcaMath.Math.rvo_epsilon) {
                        alreayCovered = true;
                        break;
                    }
                }

                if (alreayCovered) {
                    continue;
                }

                let distSq1 = OrcaMath.Math.absSq(relativePos1.x, relativePos1.y);
                let distSq2 = OrcaMath.Math.absSq(relativePos2.x, relativePos2.y);
                let radiusSqr = OrcaMath.Math.sqr(this.radius);

                obstacle1.point.sub(obstacle2.point, vecTmp);
                relativePos1.mul(-1, vecTmp1);
                let s = vecTmp1.dot(vecTmp) / OrcaMath.Math.absSq(vecTmp.x, vecTmp.y);
                vecTmp.mul(s, vecTmp);

                if (s < 0 && distSq1 <= radiusSqr) {
                    if (obstacle1.convex) {
                        let line = new OrcaKind.Line();
                        vecTmp.x = -relativePos1.y;
                        vecTmp.y = relativePos1.x;
                        vecTmp.normalize(line.dir);

                        this.orcaLines.push(line);
                    }

                    continue;
                }

                if (s > 1 && distSq2 <= radiusSqr) {
                    if (obstacle2.convex && relativePos2.det(obstacle2.dir) >= 0) {
                        let line = new OrcaKind.Line();
                        vecTmp.x = -relativePos2.y;
                        vecTmp.y = relativePos2.x;
                        vecTmp.normalize(line.dir);

                        this.orcaLines.push(line);
                    }

                    continue;
                }

                let distSqLine = OrcaMath.Math.absSq(vecTmp1.x - vecTmp.x, vecTmp1.y - vecTmp.y);
                if (s >= 0 && s <= 1 && distSqLine <= radiusSqr) {
                    let line = new OrcaKind.Line();
                    line.dir.x = -obstacle1.dir.x;
                    line.dir.y = -obstacle1.dir.y;

                    this.orcaLines.push(line);
                    continue;
                }

                if (s < 0 && distSqLine <= radiusSqr) {
                    if (!obstacle1.convex) {
                        continue;
                    }

                    obstacle2 = obstacle1;
                    let leg1 = Math.sqrt(distSq1 - radiusSqr);

                    leftLegDir.x = (relativePos1.x * leg1 - relativePos1.y * this.radius) / distSq1;
                    leftLegDir.y = (relativePos1.x * this.radius + relativePos1.y * leg1) / distSq1;
                    rightLegDir.x = (relativePos1.x * leg1 + relativePos1.y * this.radius) / distSq1;
                    rightLegDir.y = (-relativePos1.x * this.radius + relativePos1.y * leg1) / distSq1;
                } else if (s > 1 && distSqLine <= radiusSqr) {
                    if (!obstacle2.convex) {
                        continue;
                    }

                    obstacle1 = obstacle2;
                    let leg2 = Math.sqrt(distSq2 - radiusSqr);

                    leftLegDir.x = (relativePos2.x * leg2 - relativePos2.y * this.radius) / distSq2;
                    leftLegDir.y = (relativePos2.x * this.radius + relativePos2.y * leg2) / distSq2;
                    rightLegDir.x = (relativePos2.x * leg2 + relativePos2.y * this.radius) / distSq2;
                    rightLegDir.y = (-relativePos2.x * this.radius + relativePos2.y * leg2) / distSq2;
                } else {
                    if (obstacle1.convex) {
                        let leg1 = Math.sqrt(distSq1 - radiusSqr);
                        leftLegDir.x = (relativePos1.x * leg1 - relativePos1.y * this.radius) / distSq1;
                        leftLegDir.y = (relativePos1.x * this.radius + relativePos1.y * leg1) / distSq1;
                    } else {
                        leftLegDir.x = -obstacle1.dir.x;
                        leftLegDir.y = -obstacle1.dir.y;
                    }

                    if (obstacle2.convex) {
                        let leg2 = Math.sqrt(distSq2 - radiusSqr);
                        rightLegDir.x = (relativePos2.x * leg2 + relativePos2.y * this.radius) / distSq2;
                        rightLegDir.y = (-relativePos2.x * this.radius + relativePos2.y * leg2) / distSq2;
                    } else {
                        obstacle1.dir.copy(rightLegDir);
                    }
                }

                let leftNeighbor = obstacle1.prev;
                let isLeftLegForeign = false;
                let isRightLegForeign = false;

                leftNeighbor.dir.mul(-1, vecTmp);
                if (obstacle1.convex && rightLegDir.det(vecTmp) >= 0) {
                    vecTmp.copy(leftLegDir);
                    isLeftLegForeign = true;
                }

                if (obstacle2.convex && rightLegDir.det(obstacle2.dir) <= 0) {
                    obstacle2.dir.copy(rightLegDir);
                    isRightLegForeign = true;
                }

                obstacle1.point.sub(this.position, leftCutOff);
                leftCutOff.mul(invTimeHorizonObst, leftCutOff);
                obstacle2.point.sub(this.position, rightCutOff);
                rightCutOff.mul(invTimeHorizonObst, rightCutOff);
                rightCutOff.sub(leftCutOff, cutOffVector);

                this.velocity.sub(leftCutOff, vecTmp);
                let t = obstacle1 == obstacle2 ? 0.5 : vecTmp.dot(cutOffVector) / OrcaMath.Math.absSq(cutOffVector.x, cutOffVector.y);
                let tLeft = vecTmp.dot(leftLegDir);
                let tRight = this.velocity.sub(rightCutOff, vecTmp).dot(rightLegDir);

                if ((t < 0 && tLeft < 0) || (obstacle1 == obstacle2 && tLeft < 0 && tRight < 0)) {
                    this.velocity.sub(leftCutOff, vecTmp).normalize(vecTmp);

                    let line = new OrcaKind.Line();
                    line.dir.x = vecTmp.y;
                    line.dir.y = -vecTmp.x;
                    vecTmp.mul(this.radius * invTimeHorizonObst, vecTmp);
                    leftCutOff.add(vecTmp, line.point);

                    this.orcaLines.push(line);
                    continue;
                }

                if (t > 1 && tRight < 0) {
                    this.velocity.sub(rightCutOff, vecTmp).normalize(vecTmp);

                    let line = new OrcaKind.Line();
                    line.dir.x = vecTmp.y;
                    line.dir.y = -vecTmp.x;
                    vecTmp.mul(this.radius * invTimeHorizonObst, vecTmp);
                    rightCutOff.add(vecTmp, line.point);

                    this.orcaLines.push(line);
                    continue;
                }

                cutOffVector.mul(t, vecTmp).add(leftCutOff, vecTmp);
                this.velocity.sub(vecTmp, vecTmp);
                let distSqCutoff = (t < 0 || t > 1 || obstacle1 == obstacle2) ? Number.POSITIVE_INFINITY : OrcaMath.Math.absSq(vecTmp.x, vecTmp.y);

                leftLegDir.mul(tLeft, vecTmp).add(leftCutOff, vecTmp);
                this.velocity.sub(vecTmp, vecTmp);
                let distSqLeft = tLeft < 0 ? Number.POSITIVE_INFINITY : OrcaMath.Math.absSq(vecTmp.x, vecTmp.y);

                rightLegDir.mul(tRight, vecTmp).add(rightCutOff, vecTmp);
                this.velocity.sub(vecTmp, vecTmp);
                let distSqRight = tRight < 0 ? Number.POSITIVE_INFINITY : OrcaMath.Math.absSq(vecTmp.x, vecTmp.y);

                if (distSqCutoff <= distSqLeft && distSqCutoff <= distSqRight) {
                    let line = new OrcaKind.Line();
                    obstacle1.dir.mul(-1, line.dir);
                    vecTmp.x = -line.dir.y;
                    vecTmp.y = line.dir.x;
                    vecTmp.mul(this.radius * invTimeHorizonObst, vecTmp).add(leftCutOff, line.point);

                    this.orcaLines.push(line);
                    continue;
                }

                if (distSqLeft <= distSqRight) {
                    if (!isLeftLegForeign) {
                        let line = new OrcaKind.Line();
                        leftLegDir.copy(line.dir);
                        vecTmp.x = -line.dir.y;
                        vecTmp.y = line.dir.x;
                        vecTmp.mul(this.radius * invTimeHorizonObst).add(leftCutOff, line.point);

                        this.orcaLines.push(line);
                    }

                    continue;
                }

                if (!isRightLegForeign) {
                    let line = new OrcaKind.Line();
                    rightLegDir.mul(-1, line.dir);
                    vecTmp.x = -line.dir.y;
                    vecTmp.y = line.dir.x;
                    vecTmp.mul(this.radius * invTimeHorizonObst).add(rightCutOff, line.point);

                    this.orcaLines.push(line);
                }
            }

            let numObstLines = this.orcaLines.length;
            let invTimeHorizon = 1 / this.timeHorizon;
            let u = new OrcaKind.Vector2(0, 0);
            let w = new OrcaKind.Vector2(0, 0);
            let relativePos = new OrcaKind.Vector2(0, 0);
            let relativeVel = new OrcaKind.Vector2(0, 0);

            for (let i = 0; i < this.agentNeighbors.length; ++i) {
                let other = this.agentNeighbors[i].value;

                other.position.sub(this.position, relativePos);
                this.velocity.sub(other.velocity, relativeVel);
                let distSq = OrcaMath.Math.absSq(relativePos1.x, relativePos1.y);
                let combinedRadius = this.radius + other.radius;
                let combinedRadiusSq = OrcaMath.Math.sqr(combinedRadius);

                let line = new OrcaKind.Line();

                if (distSq > combinedRadiusSq) {
                    relativePos.mul(invTimeHorizon, w);
                    relativeVel.sub(w, w);

                    let wLengthSq = OrcaMath.Math.absSq(w.x, w.y);
                    let dot1 = w.dot(relativePos);

                    if (dot1 < 0 && OrcaMath.Math.sqr(dot1) > combinedRadiusSq * wLengthSq) {
                        let wLength = Math.sqrt(wLengthSq);
                        w.mul(1 / wLength, vecTmp);
                        line.dir.x = vecTmp.y;
                        line.dir.y = -vecTmp.x;
                        vecTmp.mul(combinedRadius * invTimeHorizon - wLength, u);
                    } else {
                        let leg = Math.sqrt(distSq - combinedRadiusSq);
                        if (relativePos.det(w) > 0) {
                            line.dir.x = (relativePos.x * leg - relativePos.y * combinedRadius) / distSq;
                            line.dir.y = (relativePos.x * combinedRadius + relativePos.y * leg) / distSq;
                        } else {
                            line.dir.x = (relativePos.x * leg + relativePos.y * combinedRadius) / distSq;
                            line.dir.y = (-relativePos.x * combinedRadius + relativePos.y * leg) / distSq;
                        }

                        let dot2 = relativeVel.dot(line.dir);
                        line.dir.mul(dot2, vecTmp).sub(relativeVel, u);
                    }
                } else {
                    let invTimeStep = 1 / timeStep;
                    relativePos.mul(invTimeStep, vecTmp);
                    relativeVel.sub(vecTmp, w);

                    let wLength = w.len();
                    w.mul(1 / wLength, vecTmp);
                    
                    line.dir.x = vecTmp.y;
                    line.dir.y = -vecTmp.x;
                    vecTmp.mul(combinedRadius * invTimeStep - wLength, u);
                }

                u.mul(0.5, vecTmp).add(this.velocity, line.point);
                this.orcaLines.push(line);
            }

            let lineFail = this.linearProgram2(this.orcaLines, this.maxSpeed, this.prefVelocity, false, this.newVelocity);
            if (lineFail < this.orcaLines.length) {
                this.linearProgram3(this.orcaLines, numObstLines, lineFail, this.maxSpeed, this.newVelocity);
            }
        }

        insertAgentNeighbor(agent: Agent, rangeSqr: number): number {
            if (this == agent) {
                return rangeSqr;
            }

            let delta = this.position.sub(agent.position);
            let distSqr = OrcaMath.Math.absSq(delta.x, delta.y);
            if (distSqr >= rangeSqr) {
                return rangeSqr;
            }

            if (this.agentNeighbors.length < this.maxNeighbors) {
                this.agentNeighbors.push(new Element(distSqr, agent));
            }

            let i = this.agentNeighbors.length - 1;
            for (; i != 0 && distSqr < this.agentNeighbors[i - 1].key; --i) {
                this.agentNeighbors[i] = this.agentNeighbors[i - 1];
            }

            this.agentNeighbors[i] = new Element(distSqr, agent);

            if (this.agentNeighbors.length == this.maxNeighbors) {
                rangeSqr = this.agentNeighbors[this.agentNeighbors.length - 1].key;
            }

            return rangeSqr;
        }

        insertObstacleNeighbor(obstacle: OrcaKind.Obstacle, rangeSq: number) {
            let next = obstacle.next;
            let distSq = distSqPointLineSegment(obstacle.point, next.point, this.position);
            if (distSq >= rangeSq) {
                return;
            }

            this.obstacleNeighbors.push(new Element(distSq, obstacle));

            let i = this.obstacleNeighbors.length - 1;
            for (; i != 0 && distSq < this.obstacleNeighbors[i - 1].key; --i) {
                this.obstacleNeighbors[i] = this.obstacleNeighbors[i - 1];
            }

            this.obstacleNeighbors[i] = new Element(distSq, obstacle);
        }

        linearProgram1(lines: OrcaKind.Line[], lineNo: number, radius: number, optVelocity: OrcaKind.Vector2, dirOpt: boolean, result: OrcaKind.Vector2): boolean {
            let line = lines[lineNo];
            let dot = line.point.dot(line.dir);
            let discriminat = OrcaMath.Math.sqr(dot) + OrcaMath.Math.sqr(radius) - OrcaMath.Math.absSq(line.point.x, line.point.y);
            if (discriminat < 0) {
                return false;
            }

            let sqrtDiscriminat = Math.sqrt(discriminat);
            let tLeft = -dot - sqrtDiscriminat;
            let tRight = -dot + sqrtDiscriminat;

            for (let i = 0; i < lineNo; ++i) {
                let currentLine = lines[i];
                let denominator = line.dir.det(currentLine.dir);
                let numerator = currentLine.dir.det(line.point.sub(currentLine.point));

                if (Math.abs(denominator) <= OrcaMath.Math.rvo_epsilon) {
                    if (numerator < 0) {
                        return false;
                    }

                    continue;
                }

                let t = numerator / denominator;
                if (denominator >= 0) {
                    tRight = Math.min(tRight, t);
                } else {
                    tLeft = Math.max(tLeft, t);
                }

                if (tLeft > tRight) {
                    return false;
                }
            }

            let t: number;

            if (dirOpt) {
                t = optVelocity.dot(line.dir) > 0 ? tRight : tLeft;
            } else {
                t = line.dir.dot(optVelocity.sub(line.point));
                if (t < tLeft) {
                    t = tLeft;
                } else if (t > tRight) {
                    t = tRight;
                }
            }

            line.dir.mul(t, result);
            line.point.add(result, result);

            return true;
        }

        linearProgram2(lines: OrcaKind.Line[], radius: number, optVelocity: OrcaKind.Vector2, dirOpt: boolean, result: OrcaKind.Vector2): number {
            if (dirOpt) {
                optVelocity.mul(radius, result);
            } else if (OrcaMath.Math.absSq(optVelocity.x, optVelocity.y) > OrcaMath.Math.sqr(radius)) {
                optVelocity.normalize(result);
                result.mul(radius, result);
            } else {
                result.x = optVelocity.x;
                result.y = optVelocity.y;
            }

            for (let i = 0; i < lines.length; ++i) {
                let line = lines[i];
                if (line.dir.det(line.point.sub(result)) <= 0) {
                    continue;
                }

                let orgResult = result.copy();
                if (!this.linearProgram1(lines, i, radius, optVelocity, dirOpt, result)) {
                    result.x = orgResult.x;
                    result.y = orgResult.y;

                    return i;
                }
            }

            return lines.length;
        }

        linearProgram3(lines: OrcaKind.Line[], numObstLine: number, beginLine: number, radius: number, result: OrcaKind.Vector2) {
            let distance = 0;
            for (let i = beginLine; i < lines.length; i++) {
                let line = lines[i];
                if (line.dir.det(line.point.sub(result)) <= distance) {
                    continue;
                }

                let projLines: OrcaKind.Line[] = [];
                for (let j = 0; j < numObstLine; ++j) {
                    projLines.push(lines[j]);
                }

                for (let j = numObstLine; j < i; j++) {
                    let newLine = new OrcaKind.Line();
                    let lineJ = lines[j];

                    let determinant = line.dir.det(lineJ.dir);
                    if (Math.abs(determinant) <= OrcaMath.Math.rvo_epsilon) {
                        if (line.dir.dot(lineJ.dir) > 0) {
                            continue;
                        }

                        newLine.point.x = 0.5 * (line.point.x + lineJ.point.x);
                        newLine.point.y = 0.5 * (line.point.y + lineJ.point.y);
                    } else {
                        let detRet = OrcaMath.Math.det(lineJ.dir.x, lineJ.dir.y, line.point.x - lineJ.point.x, line.point.y - lineJ.point.y);
                        newLine.point.x = line.point.x + detRet / determinant * line.dir.x;
                        newLine.point.y = line.point.y + detRet / determinant * line.dir.y;
                    }

                    lineJ.dir.sub(line.dir, newLine.dir);
                    newLine.dir.normalize(newLine.dir);
                    projLines.push(newLine);
                }

                let orgResult = result.copy();
                if (this.linearProgram2(lines, radius, new OrcaKind.Vector2(-line.dir.y, line.dir.x), true, result) < projLines.length) {
                    result.x = orgResult.x;
                    result.y = orgResult.y;
                }

                distance = OrcaMath.Math.det(line.dir.x, line.dir.y, line.point.x - result.x, line.point.y - result.y);
            }
        }
    }
}