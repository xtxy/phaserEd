gbData.pages.newProjectWindow = {
    id: "newProjectWindow",
    view: "window",
    position: "center",
    head: "Create New Project",
    body: {
        rows: [
            {
                id: "newProjectName",
                view: "text",
                label: "Name",
                width: 200,
            },
            {
                cols: [
                    {
                        id: "newProjectDir",
                        view: "text",
                        label: "Folder",
                        width: 300,
                    },
                    {
                        view: "button",
                        label: "...",
                        width: 30,
                        click: function (id, event) {
                            gbData.views.project.getNewProjectDir();
                        },
                    }
                ]
            },
            {
                cols: [
                    {
                        view: "button",
                        label: "Ok",
                        css: "webix_primary",
                        click: function (id, event) {
                            gbData.views.project.createProject();
                            $$("newProjectWindow").close();
                        },
                    },
                    {
                        view: "button",
                        label: "Cancel",
                        css: "webix_secondary",
                        click: function (id, event) {
                            $$("newProjectWindow").close();
                        },
                    }
                ]
            }
        ]
    }
};