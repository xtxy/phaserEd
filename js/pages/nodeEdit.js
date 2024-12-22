gbData.pages.uiLayout = {
    id: "uiLayoutForm",
    rows: [
        {
            cols: [
                {
                    view: "label",
                    label: "UI Layout",
                },
            ],
        },
        {
            id: "uiLayoutAnchor",
            view: "select",
            label: "Anchor",
            options: [
                "center",
                "up",
                "rightUp",
                "right",
                "rightDown",
                "down",
                "leftDown",
                "left",
                "leftUp",
            ],
            value: "center",
            on: {
                onChange: (newValue) => {
                    gbData.views.nodeEdit.modifyUILayoutAnchor(newValue);
                },
            },
        },
        {
            id: "uiLayoutOffset",
            view: "select",
            label: "Offset",
            options: [
                "pixel",
                "percent",
            ],
            value: "pixel",
            on: {
                onChange: (newValue) => {
                    gbData.views.nodeEdit.modifyUILayoutOffsetKind(newValue);
                },
            },
        },
        {
            cols: [
                {
                    id: "uiLayoutOffsetX",
                    view: "text",
                    type: "number",
                    label: "X",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyUILayoutOffsetX();
                        }
                    },
                },
                {
                    id: "uiLayoutOffsetY",
                    view: "text",
                    type: "number",
                    label: "Y",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyUILayoutOffsetY();
                        }
                    },
                },
            ]
        },
    ],
};

gbData.pages.nodeEdit = {
    id: "nodeEditPage",
    rows: [
        {
            cols: [
                {
                    view: "menu",
                    openAction: "click",
                    data: [
                        { value: "Add...", submenu: ["UILayout", { $template: "Separator" }, "Script", "Json"] },
                        { value: "Del" },
                    ],
                    on: {
                        onMenuItemClick: function (id) {
                            let value = this.getMenuItem(id).value;
                            switch (value) {
                                case "UILayout":
                                    gbData.views.nodeEdit.addUILayout();
                                    break;
                            }
                        }
                    }
                },
            ],
        },
        {
            id: "nodeName",
            view: "text",
            label: "Name",
            labelAlign: "center",
            labelWidth: 60,
        },
        {
            cols: [
                {
                    view: "label",
                    label: "Pos",
                    labelWidth: 60,
                    labelAlign: "center",
                    width: 70,
                },
                {
                    id: "nodePosX",
                    view: "text",
                    label: "X",
                    labelWidth: 20,
                    labelAlign: "center",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyPosX();
                        }
                    },
                },
                {
                    id: "nodePosY",
                    view: "text",
                    label: "Y",
                    labelWidth: 20,
                    labelAlign: "center",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyPosY();
                        }
                    },
                },
                {
                    id: "nodePosZ",
                    view: "text",
                    label: "Z",
                    labelWidth: 20,
                    labelAlign: "center",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyPosZ();
                        }
                    },
                },
            ]
        },
        {
            cols: [
                {
                    view: "label",
                    label: "Scale",
                    labelWidth: 60,
                    labelAlign: "center",
                    width: 70,
                },
                {
                    id: "nodeScaleX",
                    view: "text",
                    label: "X",
                    labelWidth: 20,
                    labelAlign: "center",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyScaleX();
                        }
                    },
                },
                {
                    id: "nodeScaleY",
                    view: "text",
                    label: "Y",
                    labelWidth: 20,
                    labelAlign: "center",
                    on: {
                        onTimedKeyPress: function () {
                            gbData.views.nodeEdit.modifyScaleY();
                        }
                    },
                },
            ]
        },
        {
            id: "nodeAngle",
            view: "text",
            label: "Angle",
            labelWidth: 60,
            labelAlign: "center",
            on: {
                onTimedKeyPress: function () {
                    gbData.views.nodeEdit.modifyAngle();
                }
            },
        },
        gbData.pages.uiLayout,
        {
            id: "otherNodeEdit",
            rows: [],
        },
        // {
        //     view: "button",
        //     label: "Add Script",
        //     click: () => {
        //         gbData.views.nodeEdit.addScript();
        //     },
        // },
        // {
        //     id: "nodeScripts",
        //     rows: [],
        // }
    ]
};