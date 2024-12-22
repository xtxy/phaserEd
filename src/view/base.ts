import { SceneNode } from "../model/scene";
import { GameNode } from "../scene/scene";

export function SceneNode2GameNode(sceneNode: SceneNode): GameNode {
    let gameNode = new GameNode();
    gameNode.name = sceneNode.name;
    gameNode.file = sceneNode.file;
    gameNode.actor = sceneNode.actor;
    gameNode.transform = sceneNode.transform;
    gameNode.uiLayout = sceneNode.uiLayout;

    return gameNode;
}