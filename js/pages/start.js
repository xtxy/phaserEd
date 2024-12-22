gbData.pages.start = {
    id: "startPage",
    position: "center",
    rows: [
        {},
        {
            cols: [
                {},
                {
                    view: "button",
                    label: "Create Project",
                    width: 300,
                    position: "center",
                    click: function () {
                        webix.ui(gbData.pages.newProjectWindow).show();
                    }
                },
                {}
            ]
        },
        {
            cols: [
                {},
                {
                    view: "button",
                    label: "Open Project",
                    width: 300,
                    position: "center",
                    click: function () {
                        gbData.views.project.openProject();
                    }
                },
                {}
            ]
        },
        {}
    ]
};