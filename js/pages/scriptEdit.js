function scriptEditAdd(id, name, file, props, index) {
    let view = {
        id: id,
        rows: [
            {
                cols: [
                    {
                        id: id + "_class",
                        view: "label",
                        label: name,
                    },
                    {
                        id: id + "_delBtn",
                        view: "button",
                        width: 60,
                        label: "X",
                        click: function (id) {
                            console.log("del script:", id);
                            gbData.views.nodeEdit.delScript(id);
                        },
                    },
                ],
            },
            {
                id: id + "_file",
                view: "label",
                label: file,
            },
        ]
    };

    for (let prop of props) {
        let propObj = {
            id: id + "_prop_" + prop.name,
        };
        let element = {
            id: propObj.id,
            view: "text",
            label: prop.name,
            value: prop.value,
            on: {
                onChange: function(value) {
                    gbData.views.nodeEdit.scriptPropChange(this.id, value);
                }.bind(propObj),
            },
        };
        view.rows.push(element);
    }

    $$("nodeScripts").addView(view, index);
}

function delScript(id) {

}