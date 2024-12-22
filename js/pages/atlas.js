gbData.pages.atlasPic = {
    id: "atlasPicPage",
    header: "Atlas",
    body: {
        id: "atlasPicBodyPage",
        rows: [
            {
                cols: [
                    {
                        id: "atlasLoadBtn",
                        view: "button",
                        label: "Load",
                        width: 100,
                        click: function () {
                            gbData.views.atlas.loadPic();
                        },
                    },
                    {
                        id: "atlasSyncBtn",
                        view: "button",
                        label: "Sync",
                        width: 100,
                        click: function () {
                            gbData.views.atlas.syncPic();
                        },
                    },
                    {
                        id: "altasClearBtn",
                        view: "button",
                        label: "Clear",
                        width: 100,
                        click: function () {
                            gbData.views.atlas.clearPic();
                        },
                    },
                    {
                        id: "atlasBgColor",
                        view: "colorpicker",
                        label: 'Bg Color',
                        labelWidth: 70,
                        value: '#000000',
                        width: 180,
                        on: {
                            onChange: function (newValue) {
                                gbData.views.atlas.setBgColor(newValue);
                            },
                        }
                    },
                    {
                        id: "atlasScale",
                        view: "slider",
                        label: "Scale",
                        labelWidth: 60,
                        title: webix.template("#value#"),
                        width: 300,
                        value: 100,
                        min: 50,
                        max: 300,
                        on: {
                            onChange: function (newValue) {
                                gbData.views.atlas.scalePic(newValue);
                            }
                        },
                    },
                    {
                        id: "atlasInfo",
                        view: "label",
                        label: "",
                    },
                ]
            },
            {
                cols: [
                    {
                        id: "atlasPointerLabel",
                        view: "label",
                        label: "",
                    }
                ],
            },
            {
                view: 'template',
                type: "clean",
                template: "<div id='" + gbData.atlasPicDiv + "'></div>"
            }
        ]
    },
};

gbData.pages.atlasEdit = {
    id: "atlasEditPage",
    rows: [
        {
            cols: [
                {
                    id: "atlasPicItemEditBtn",
                    view: "button",
                    label: "Edit",
                    click: function () {
                        gbData.views.atlas.showEditTiles();
                    },
                },
                {
                    id: "atlasPicItemDelBtn",
                    view: "button",
                    label: "Delete",
                    click: function () {
                        gbData.views.atlas.clearEditTiles();
                    },
                },
                {
                    id: "atlasPicItemSaveBtn",
                    view: "button",
                    label: "Save",
                    click: function () {
                        gbData.views.atlas.saveEditPic();
                    }
                }
            ]
        },
        {
            id: "atlasPicItemScale",
            view: "slider",
            label: "Scale",
            title: webix.template("#value#"),
            value: 100,
            min: 50,
            max: 300,
            on: {
                onChange: function (newValue) {
                    gbData.views.atlas.scaleEditPic(newValue);
                }
            },
        },
        {
            view: 'template',
            type: "clean",
            template: "<div id='" + gbData.tileSpriteDiv + "'></div>"
        },
        {
            template: "<strong>Atlas Editor</strong>",
            height: 30,
        },
        {
            cols: [
                {
                    name: "createAtlasBtn",
                    view: "button",
                    label: "Create",
                    click: function () {
                        gbData.views.atlas.createAtlas();
                    },
                },
                {
                    name: "loadAtlasBtn",
                    view: "button",
                    label: "Load",
                    click: function () {
                        gbData.views.atlas.loadAtlas();
                    },
                },
                {
                    name: "saveAtlasBtn",
                    view: "button",
                    label: "Save",
                    click: function () {
                        gbData.views.atlas.saveAtlas();
                    },
                }
            ]
        },
        {
            id: "atlasLabel",
            view: "label",
            label: "file:",
        },
        {
            id: "atlasImgLabel",
            view: "label",
            label: "image:",
        },
        {
            cols: [
                {
                    name: "addAtlasCombineBtn",
                    view: "button",
                    label: "AddOne",
                    click: function () {
                        gbData.views.atlas.addAtlasItem();
                    },
                },
                {
                    name: "addAtlasBatchBtn",
                    view: "button",
                    label: "AddBatch",
                    click: function () { },
                },
                {
                    name: "renameAtlasBtn",
                    view: "button",
                    label: "Rename",
                    click: function () {
                        gbData.views.atlas.renameFrame();
                    },
                },
                {
                    name: "delAtlasBtn",
                    view: "button",
                    label: "Del",
                    click: function () {
                        gbData.views.atlas.delFrame();
                    },
                }
            ]
        },
        {
            id: "atlasItemList",
            name: "atlasItemList",
            view: "list",
            select: true,
            type: {
                height: 60,
                template: "<div class='atlas_item'><img class='atlas_img' src='#img#'><span class='atlas_name'>#name#</span></div>",
            },
        }
    ]
};