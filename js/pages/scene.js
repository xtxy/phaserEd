gbData.pages.sceneToolBar = {
    id: "sceneToolBar",
    height: 35,
    cols: [
        {
            id: "sceneNameLabel",
            view: "label",
        }
    ],
};

gbData.pages.scene = {
    id: "scenePage",
    header: "Scene",
    body: {
        id: "sceneBodyPage",
        rows: [
            {
                cols: [
                    {
                        view: "button",
                        label: "New",
                        autowidth: true,
                        click: function () {
                            gbData.views.scene.newScene();
                        },
                    },
                    {
                        view: "button",
                        label: "Load",
                        autowidth: true,
                        click: function () {
                            gbData.views.scene.loadScene();
                        },
                    },
                    {
                        view: "button",
                        label: "Save",
                        autowidth: true,
                        click: function () {
                            gbData.views.scene.saveScene();
                        },
                    },
                    {
                        view: "button",
                        label: "Save As",
                        autowidth: true,
                        click: function () {
                            gbData.views.scene.newScene();
                        },
                    },
                    createGameSceneToolbar("scene", gbData.sceneToolbarHandler),
                ],
            },
            gbData.pages.sceneToolBar,
            {
                view: 'template',
                width: 1032,
                template: "<div id='" + gbData.sceneDiv + "'></div>",
            },
            
        ],
    },
};