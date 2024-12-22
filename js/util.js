var gbData = {
    sceneDiv: "sceneDiv",
    atlasPicDiv: "atlasPicDiv",
    tileSpriteDiv: "tileSpriteDiv",
    jsonEditDiv: "jsonEditDiv",
    tileSetDiv: "tileSetDiv",
    tileMapDiv: "tileMapDiv",

    tileMapBrushNormal: "normal",
    tileMapBrushRandom: "random",
    tileMapBrushRandDir: "randDir",

    tileMapPaint: "paint",
    tileMapErase: "erase",
    tileMapSelect: "select",

    sceneToolbarHandler: {},
    tileMapToolbarHandler: {},
    views: {},
    pages: {},
};

function registerView(name, view) {
    gbData.views[name] = view;
}

function uiItem(name) {
    return $$(name);
}

function uiConfirm(obj) {
    return webix.confirm(obj);
};

function uiPrompt(obj) {
    return webix.prompt(obj);
}

function uiNewId() {
    return webix.uid();
}

function uiShow(item) {
    if (typeof item === 'string') {
        item = uiGet(item);
    }

    return webix.ui(item);
}

function uiGet(name) {
    return gbData.pages[name];
}

function getTreePathById(tree, id) {
    let index;
    let pathArr = [];

    while (id) {
        index = tree.getBranchIndex(id);
        pathArr.unshift(index);
        id = tree.getParentId(id);
    }

    return pathArr;
}

function getTreeItemIdByPath(tree, path) {
    if (!path || path.length == 0) {
        return 0;
    }

    let arr = tree.serialize(0, true);
    let root = { data: arr };
    let node = root;
    for (let i = 0; i < path.length; ++i) {
        node = node.data[path[i]];
    }

    return node.id;
}

function popupTileLayerEditor(windowId, head) {
    let window = {
        id: windowId,
        view: "window",
        position: "center",
        head: head,
        body: gbData.pages.tileLayerEditor,
    };

    webix.ui(window).show();
    $$("tileLayerName").focus();
}

function popupMsg(content, kind) {
    webix.message(content, kind);
}

function createJsonEditor(div, changeCallback) {
    let container = document.getElementById(div);
    let editor = new JSONEditor(container, {
        language: "en",
        mode: "code",
        onChange: changeCallback,
    });

    return editor;
}

function queryView(parent, condition) {
    return parent.queryView(condition);
}

function addNodeScript(id, name, file, props, index) {
    scriptEditAdd(id, name, file, props, index);
}