gbData.pages.fileList = {
    id: "fileListPage",
    rows: [
        {
            id: "projectDir",
            view: "label",
            label: "",
        },
        {
            view: "menu",
            subMenuPos: "right",
            openAction: "click",
            data: [
                { value: "New...", submenu: ["Folder", { $template: "Separator" }, "Script", "Json"] },
                { value: "Add" },
                { value: "Edit" },
                { value: "Reveal" },
            ],
            on: {
                onMenuItemClick: function (id) {
                    let value = this.getMenuItem(id).value;
                    switch (value) {
                        case "Folder":
                            gbData.views.fileList.createFolder();
                            break;

                        case "Json":
                            gbData.views.fileList.createJsonFile();
                            break;

                        case "Add":
                            gbData.views.fileList.addFile();
                            break;

                        case "Edit":
                            gbData.views.fileList.editFile();
                            break;
                        
                        case "Reveal":
                            gbData.views.fileList.revealInExplorer();
                            break;
                    }
                }
            }
        },
        {
            id: "fileList",
            view: "list",
            width: 300,
            template: "{common.itemIcon()} #Name#",
            type: {
                itemIcon: function (obj) {
                    let icon = "fa-solid fa-file";
                    if (obj.Dir) {
                        icon = "fa-solid fa-folder";
                    } else {
                        let arr = obj.Name.split('.');
                        let sfx = arr[arr.length - 1];
                        switch (sfx) {
                            case "png":
                                icon = "fa-solid fa-image";
                                break;
                        }
                    }

                    return "<span class='" + icon + "'></span>";
                }
            },
            on: {
                onItemClick: function (id, e, trg) {
                    gbData.views.fileList.clickItem(id);
                }
            },
            onContext: {},
            data: [],
            drag: "source",
        }
    ]
}

gbData.pages.fileListContextMenu = {
    id: "fileListContextMenu",
    view: "contextmenu",
    data: ["Rename", "Delete"],
    on: {
        onItemClick: function (id) {
            // var context = this.getContext();
            // var list = context.obj;
            // var listId = context.id;

            // switch (this.getItem(id).value) {
            //     case "Delete":
            //         {
            //             gbPage.fileListView.delFile(list.getItem(listId).Name);
            //         }
            //         break;
            // }
            // webix.message("List item: <i>" + list.getItem(listId).Name + "</i> <br/>Context menu item: <i>" + this.getItem(id).value + "</i>");
        }
    }
};