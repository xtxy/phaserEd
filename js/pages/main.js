gbData.pages.main = {
    id: "mainPage",
    rows: [
        {
            id: "projectName",
            view: "label",
            label: "",
        },
        {
            height: 1000,
            cols: [
                {
                    id: "centerTab",
                    view: "tabview",
                    tabbar: {
                        on: {
                            onAfterTabClick: function (id, evt) {
                                if (id == gbData.centerView) {
                                    return;
                                }

                                gbData.centerView = id;
                                switch (id) {
                                    case "sceneBodyPage":
                                        gbData.views.scene.show();
                                        break;

                                    case "tileMapBodyPage":
                                        gbData.views.tileMap.show();
                                        break;
                                }
                            }
                        }
                    },
                    cells: [
                        gbData.pages.scene,
                        gbData.pages.tileMap,
                        gbData.pages.atlasPic,
                    ]
                },
                {
                    rows: [
                        gbData.pages.fileList,
                        {
                            view: 'multiview',
                            animate: false,
                            width: 300,
                            cells: [
                                gbData.pages.sceneNode,
                                gbData.pages.tileMapBrushCache,
                            ],
                        },
                        
                    ],
                },
                {
                    rows: [
                        {
                            cols: [
                                {
                                    view: "button",
                                    label: "生成",
                                    click: function () {
                                    }
                                },
                                {
                                    view: "button",
                                    label: "删除",
                                    click: function () {
                                    }
                                },
                            ]
                        },
                        {
                            id: 'properity',
                            view: 'multiview',
                            animate: false,
                            width: 400,
                            cells: [
                                gbData.pages.nodeEdit,
                                gbData.pages.atlasEdit,
                                gbData.pages.tileMapEdit,
                            ],
                        },
                    ],
                },
            ],
        },
        {},
    ],
};
