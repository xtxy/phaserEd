gbData.pages.tileMapEdit = {
    id: "tileMapEditPage",
    rows: [
        {
            cols: [
                {
                    id: "tileSetLoadBtn",
                    view: "button",
                    label: "Load",
                    autowidth: true,
                    click: function () {
                        gbData.views.tileMapEdit.load();
                    },
                },
                {
                    id: "tileSetInfo",
                    view: "label",
                    label: "",
                },
            ]
        },
        {
            cols: [
                {
                    id: "tileSetClearSelectBtn",
                    view: "button",
                    label: "Clear",
                    autowidth: true,
                    click: function () {
                        gbData.views.tileSet.clearSelects();
                    },
                },
                {
                    id: "tileSetBgColor",
                    view: "colorpicker",
                    label: 'Bg Color',
                    labelWidth: 70,
                    value: '#000000',
                    width: 180,
                    on: {
                        onChange: function (newValue) {
                            gbData.views.tileMapEdit.setTileSetBgColor(newValue);
                        },
                    }
                },
            ]
        },
        {
            cols: [
                {
                    id: "tileSetScale",
                    view: "slider",
                    label: "Scale",
                    labelWidth: 45,
                    title: webix.template("#value#"),
                    width: 240,
                    value: 100,
                    min: 50,
                    max: 300,
                    on: {
                        onChange: function (newValue) {
                            gbData.views.tileMapEdit.scaleMap(newValue);
                        }
                    },
                },
                {
                    id: "tileSetMode",
                    view: "select",
                    label: "Mode",
                    labelWidth: 45,
                    width: 130,
                    options: [
                        gbData.tileMapBrushNormal,
                        gbData.tileMapBrushRandom,
                        gbData.tileMapBrushRandDir,
                    ]
                }
            ]
        },
        {
            view: 'template',
            template: "<div id='" + gbData.tileSetDiv + "'></div>",
        },
        {
            id: "tileMapCollisionLayer",
            cols: [
                {
                    id: "tileMapCollisionCheckBox",
                    view: "checkbox",
                    label: "Collision",
                    labelWidth: 70,
                    disabled: true,
                    width: 100,
                    on: {
                        onChange: (newValue) => {
                            gbData.views.tileMapEdit.enableCollisonLayer(newValue ? true : false);
                        },
                    }
                },
                {
                    id: "tileMapCollisionPaintBtn",
                    view: "button",
                    label: "Paint",
                    disabled: true,
                    autowidth: true,
                    click: () => {
                        gbData.views.tileMapEdit.startPaintCollision();
                    },
                },
                {
                    id: "tileMapCollisionPaintingIcon",
                    view: "label",
                    align: "center",
                    label: '<i></i>',
                    width: 60,
                },
                {
                    id: "tileMapCollisionVisibleBtn",
                    view: "label",
                    label: '<i class="fa-solid fa-eye"></i>',
                    disabled: true,
                    width: 60,
                    click: () => {
                        gbData.views.tileMap.switchCollisionVisible();
                    },
                },
                {
                    id: "tileMapCollisionEditBtn",
                    view: "label",
                    label: '<i class="fa-solid fa-pencil"></i>',
                    disabled: true,
                    width: 60,
                    click: () => {
                        gbData.views.tileMapEdit.editCollisionLayer();
                    },
                }
            ]
        },
        {
            cols: [
                {
                    view: "button",
                    label: "Attach",
                    autowidth: true,
                    click: function () {
                        gbData.views.tileMapEdit.loadTileSet();
                    },
                },
                {
                    view: "button",
                    label: "Add",
                    autowidth: true,
                    click: function () {
                        gbData.views.tileMapEdit.addTileLayer();
                    }
                },
                {
                    view: "button",
                    label: "Del",
                    autowidth: true,
                    click: function () {
                        gbData.views.tileMapEdit.delTileLayer();
                    }
                }
            ]
        },
        {
            id: "tileMapLayers",
            view: "datatable",
            columns: [
                {
                    id: "name", header: "Name", width: 120, template: (obj) => {
                        if (obj.collision) {
                            return "<font color='#ff9700'>" + obj.name + "</font>";
                        } else {
                            return "<font color='#010101'>" + obj.name + "</font>";
                        }
                    }
                },
                {
                    id: "tileSize", header: '<i class="fa-solid fa-expand" title="Tile Size"></i>', width: 60, template: (obj) => {
                        return "<span>" + obj.tileWidth + "x" + obj.tileHeight + "</span>";
                    },
                },
                {
                    id: "alpha", header: '<i class="fa-solid fa-circle-half-stroke" title="Alpha"></i>', width: 50,
                },
                {
                    id: "visible", header: "", width: 40, template: (obj) => {
                        if (obj.visible) {
                            return "<i class='fa-solid fa-eye'></i>";
                        } else {
                            return "<i class='fa-solid fa-eye-slash'></i>";
                        }
                    },
                },
                {
                    id: "lock", header: "", width: 40, template: (obj) => {
                        if (obj.lock) {
                            return "<i class='fa-solid fa-lock'></i>";
                        } else {
                            return "<i class='fa-solid fa-lock-open'></i>";
                        }
                    },
                },
                {
                    id: "info", header: "", width: 40, template: "<i class='fa-solid fa-pencil'></i>",
                }
            ],
            onClick: {
                "fa-eye": function (ev, id) {
                    let item = $$("tileMapLayers").getItem(id);
                    gbData.views.tileMapEdit.hideTileLayer(item.name);
                },
                "fa-eye-slash": function (ev, id) {
                    let item = $$("tileMapLayers").getItem(id);
                    gbData.views.tileMapEdit.showTileLayer(item.name);
                },
                "fa-lock": function (ev, id) {
                    let item = $$("tileMapLayers").getItem(id);
                    gbData.views.tileMapEdit.unlockTileLayer(item.name);
                },
                "fa-lock-open": function (ev, id) {
                    let item = $$("tileMapLayers").getItem(id);
                    gbData.views.tileMapEdit.lockTileLayer(item.name);
                },
                "fa-pencil": function (ev, id) {
                    let item = $$("tileMapLayers").getItem(id);
                    gbData.views.tileMapEdit.editTileLayer(item);
                },
            },
            scroll: true,
            drag: "order",
            select: true,
            data: [],
            on: {
                onAfterDrop: function () {
                    gbData.views.tileMapEdit.reorderTileLayer();
                },
                onAfterSelect: function (selection) {
                    gbData.views.tileMapEdit.selectTileLayer(selection.id);
                },
            },
        },
    ]
};

gbData.pages.tileLayerEditor = {
    rows: [
        {
            id: "tileLayerName",
            view: "text",
            placeholder: "layer name",
            width: 200,
        },
        {
            id: "tileLayerTileWidth",
            view: "text",
            type: "number",
            label: "Tile Width",
            width: 200,
            on: {
                onChange: (newValue) => {
                    if (!$$("tileLayerTileSquareCheck").getValue()) {
                        $$("tileLayerTileHeight").setValue(newValue);
                    }
                },
                onTimedKeyPress: () => {
                    if (!$$("tileLayerTileSquareCheck").getValue()) {
                        $$("tileLayerTileHeight").setValue($$("tileLayerTileWidth").getValue());
                    }
                },
            },
        },
        {
            id: "tileLayerTileHeight",
            view: "text",
            type: "number",
            label: "Tile Height",
            width: 200,
            disabled: true,
        },
        {
            id: "tileLayerTileSquareCheck",
            view: "checkbox",
            label: "Not Square",
            labelWidth: 140,
            on: {
                onChange: (newValue) => {
                    if (newValue) {
                        $$("tileLayerTileHeight").enable();
                    } else {
                        $$("tileLayerTileHeight").setValue($$("tileLayerTileWidth").getValue());
                        $$("tileLayerTileHeight").disable();
                    }
                },
            }
        },
        {
            id: "tileLayerAlpha",
            view: "text",
            label: "Alpha",
            width: 200,
            value: 1,
        },
        {
            cols: [
                {
                    view: "button",
                    label: "Ok",
                    css: "webix_primary",
                    click: (id, event) => {
                        gbData.views.tileMapEdit.tileLayerWindowDone(true);
                    },
                },
                {
                    view: "button",
                    label: "Cancel",
                    css: "webix_secondary",
                    click: (id, event) => {
                        gbData.views.tileMapEdit.tileLayerWindowDone(false);
                    },
                }
            ]
        }
    ]
};