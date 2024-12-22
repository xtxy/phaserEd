gbData.pages.gameSceneNode = {
    id: "gameSceneNode",
    header: "Game",
    rows: [
        {
            view: "button",
            label: "Del",
            click: function () {
                gbData.views.sceneNode.delNode();
            },
        },
        {
            id: 'gameNodeFilter',
            view: 'text',
            label: "Filter",
            labelWidth: 80,
            width: 200,
            on: {
                onTimedKeyPress: function () {
                    // var value = this.getValue().trim().toLowerCase();
                    // $$("studioPhoneList").filter(function (obj) {
                    //     return obj.customName.toLowerCase().indexOf(value) !== -1 ||
                    //         obj._id.toLowerCase().indexOf(value) !== -1;
                    // })
                }
            },
        },
        {
            id: "gameSceneNodeTree",
            view: "tree",
            type: "lineTree",
            select: true,
            drag: true,
            data: [
            ],
            template: function (obj, com) {
                let icon = "";
                switch (obj.kind) {
                    case "tileMap":
                        icon = '<i class="fa-solid fa-map"></i>';
                        break;

                    case "sprite":
                        icon = '<i class="fa-solid fa-person"></i>';
                        break;
                }

                return com.icon(obj, com) + icon + "&nbsp;" + obj.name;
            },
            on: {
                onBeforeDrop: function (context) {
                    gbData.views.sceneNode.dropIn(context);
                    return false;
                },
                onAfterSelect: function (id) {
                    gbData.views.sceneNode.selectNode(id, false);
                }
            }
        }
    ]
};

gbData.pages.uiSceneNode = {
    id: "uiSceneNode",
    header: "UI",
    rows: [
        {
            view: "button",
            label: "Del",
            click: function () {
                gbData.views.sceneNode.uiDelNode();
            },
        },
        {
            id: 'uiNodeFilter',
            view: 'text',
            label: "Filter",
            labelWidth: 80,
            width: 200,
            on: {
                onTimedKeyPress: function () {
                    // var value = this.getValue().trim().toLowerCase();
                    // $$("studioPhoneList").filter(function (obj) {
                    //     return obj.customName.toLowerCase().indexOf(value) !== -1 ||
                    //         obj._id.toLowerCase().indexOf(value) !== -1;
                    // })
                }
            },
        },
        {
            id: "uiSceneNodeTree",
            view: "tree",
            type: "lineTree",
            select: true,
            drag: true,
            data: [
            ],
            template: function (obj, com) {
                let icon = "";
                switch (obj.kind) {
                    case "button":
                        icon = '<i class="fa-solid fa-map"></i>';
                        break;
                }

                return com.icon(obj, com) + icon + "&nbsp;" + obj.name;
            },
            on: {
                onBeforeDrop: function (context) {
                    gbData.views.sceneNode.dropIn(context);
                    return false;
                },
                onAfterSelect: function (id) {
                    gbData.views.sceneNode.selectNode(id, true);
                }
            }
        }
    ]
};

gbData.pages.sceneNode = {
    id: "sceneNodePage",
    rows: [
        {
            id: "sceneNodeTab",
            view: "tabview",
            tabbar: {
                on: {
                    onAfterTabClick: function (id, evt) {
                        gbData.sceneNodeId = id;
                        gbData.views.scene.nodeTreeChange(id);
                    }
                }
            },
            cells: [
                gbData.pages.gameSceneNode,
                gbData.pages.uiSceneNode,
            ]
        },
    ]
};
