function createGameSceneToolbar(pfx, handler) {
    return {
        cols: [
            {
                id: pfx + "BgColor",
                view: "colorpicker",
                label: 'Bg Color',
                labelWidth: 70,
                value: '#000000',
                width: 180,
                on: {
                    onChange: function (newValue) {
                        handler.setSceneBgColor(newValue);
                    },
                }
            },
            {
                id: pfx+ "Scale",
                view: "slider",
                label: "Scale",
                labelWidth: 60,
                title: webix.template("#value#"),
                width: 240,
                value: 100,
                min: 50,
                max: 300,
                on: {
                    onChange: function (newValue) {
                        handler.scaleScene(newValue);
                    }
                },
            },
            {
                id: pfx + "PointerPos",
                view: "label",
                label: "",
            },
        ],
    };
}