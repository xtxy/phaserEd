gbData.pages.jsonEditWindow = {
    id: "jsonEditWindow",
    view: "window",
    position: "center",
    head: "Json Editor",
    width: 824,
    height: 700,
    move: true,
    modal: true,
    body: {
        rows: [
            {
                cols: [
                    {
                        id: "jsonEditFileName",
                        view: "label",
                        width: 300,
                    },
                    {},
                    {
                        view: "button",
                        label: "Save",
                        width: 80,
                        click: function () {
                            gbData.views.jsonEdit.saveFile();
                        },
                    },
                    {
                        view: "button",
                        label: "Close",
                        width: 80,
                        click: function () {
                            gbData.views.jsonEdit.closeEditor();
                        },
                    }
                ],
            },
            {
                view: 'template',
                template: "<div id='" + gbData.jsonEditDiv + "' style='width: 800px; height: 600px;'></div>",
            },
        ]
    },
};
