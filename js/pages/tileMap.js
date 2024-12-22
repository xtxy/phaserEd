gbData.pages.tileMapPaintToolBar = {
    id: "tileMapPaintToolBar",
    cols: [
    ],
};

gbData.pages.tileMapSelectToolBar = {
    id: "tileMapSelectToolBar",
    cols: [
        {
            view: "button",
            label: "Save",
            autowidth: true,
            click: function () {
                gbData.views.tileMap.createImageFromSelects();
            },
        },
        {
            view: "button",
            label: "Copy",
            autowidth: true,
            click: function () {
                gbData.views.tileMap.copySelects();
            },
        },
        {
            view: "button",
            label: "Cut",
            autowidth: true,
            click: function () {
                gbData.views.tileMap.cutSelects();
            },
        },
        {
            view: "button",
            label: "Paste",
            autowidth: true,
            click: function () {
                gbData.views.tileMap.pasteSelects();
            },
        },
        {
            view: "button",
            label: "Clear",
            autowidth: true,
            click: function () {
                gbData.views.tileMap.clearSelects();
            },
        },
    ]
};

gbData.pages.tileMapToolBar = {
    id: 'tileMapToolBar',
    // template: 'row 1',
    height: 35,
    cols: [
        {
            id: "tileMapCommonToolBar",
            cols: [
                {
                    id: "tileMapMode",
                    view: "radio",
                    label: "Mode",
                    labelWidth: 45,
                    width: 320,
                    options: [
                        gbData.tileMapPaint,
                        gbData.tileMapErase,
                        gbData.tileMapSelect,
                    ],
                    value: gbData.tileMapPaint,
                    on: {
                        onChange: function (newValue) {
                            gbData.views.tileMap.changeMode(newValue);
                        },
                    },
                },
                {
                    view: "checkbox",
                    label: "Show Grid",
                    value: 1,
                    on: {
                        onChange: function (newValue) {
                            gbData.views.tileMap.showGrid(newValue);
                        }
                    },
                },
                {
                    id: "tileMapNameLabel",
                    view: "label",
                },
                {
                    id: "tileMapSizeLabel",
                    view: "label",
                },
            ]
        },
        {
            view: "multiview",
            cells: [
                gbData.pages.tileMapPaintToolBar,
                gbData.pages.tileMapSelectToolBar,
            ],
        },
    ]
};

gbData.pages.tileMap = {
    id: "tileMapPage",
    header: "TileMap",
    body: {
        id: "tileMapBodyPage",
        rows: [
            {
                cols: [
                    {
                        id: "newTileMapBtn",
                        view: "button",
                        label: "New",
                        autowidth: true,
                        click: function () {
                            gbData.views.tileMapEdit.newTileMap();
                        },
                    },
                    {
                        id: "tileMapLoadBtn",
                        view: "button",
                        label: "Load",
                        autowidth: true,
                        click: function () {
                            gbData.views.tileMap.loadTileMap();
                        },
                    },
                    {
                        id: "tileMapSaveBtn",
                        view: "button",
                        label: "Save",
                        autowidth: true,
                        click: function () {
                            gbData.views.tileMap.saveTileMap();
                        },
                    },
                    {
                        view: "button",
                        label: "Save As",
                        autowidth: true,
                        click: function () {
                            gbData.views.tileMap.saveNewTileMap();
                        },
                    },
                    {
                        view: "button",
                        label: "Close",
                        autowidth: true,
                        click: function () {
                            gbData.views.tileMap.closeTileMap();
                        },
                    },
                    createGameSceneToolbar("tileMap", gbData.pages.tileMapToolbarHandler),
                ]
            },
            gbData.pages.tileMapToolBar,
            {
                view: 'template',
                width: 1032,
                template: "<div id='" + gbData.tileMapDiv + "'></div>"
            },
        ]
    },
};

gbData.pages.tileMapBrushCache = {
    id: "tileMapBrushCachePage",
    rows: [
        {
            view: "button",
            label: "Del",
            autowidth: true,
            click: function () {
                gbData.views.tileMap.delBrushCache();
            },
        },
        {
            id: "tileMapBrushCacheList",
            view: "dataview",
            width: 290,
            select: true,
            xCount: 2,
            type: {
                width: 140,
                height: 120,
            },
            template: "<img class='tile_cache_img' src='#img#'></img>",
        },
    ],
};