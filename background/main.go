package main

import (
	"bvUtils/file"
	"bvUtils/logger"
	"encoding/base64"
	"encoding/json"
	"flag"
	"image/png"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"bvUtils/lorca"

	"github.com/sqweek/dialog"
)

const (
	png_data_pfx = "data:image/png;base64,"
)

type Ret struct {
	Error string
	Data  any
}

type Record struct {
	LastDir string
}

var record Record
var fileServerAddr string

func (record *Record) updateLastDir(lastDir string) {
	if lastDir == record.LastDir {
		return
	}

	record.LastDir = lastDir
	record.save()
}

func (record Record) save() {
	slice, err := json.Marshal(record)
	if err != nil {
		logger.Error("json encode record error:", err)
		return
	}

	err = os.WriteFile("record.json", slice, 0755)
	if err != nil {
		logger.Error("write record error:", err)
	}
}

func main() {
	logger.ParseLevel("stdout")

	var debug bool
	flag.BoolVar(&debug, "d", false, "debug")
	flag.Parse()

	indexFileName := "indexTs.html"
	if debug {
		indexFileName = "indexTsDebug.html"
	}

	dir, _ := os.Getwd()
	dir = strings.ReplaceAll(dir, "\\", "/")
	htmlFile := path.Join(dir, "web/"+indexFileName)

	file.ReadCfg("record.json", &record)

	ui, err := lorca.New("file:///"+htmlFile, "cache", 1920, 1080, "--disable-web-security")
	if err != nil {
		logger.Error("new error:", err)
		return
	}
	defer ui.Close()

	prjFileHandler.start()
	fileServerAddr, err = startFileServer()
	if err != nil {
		return
	}

	logger.Debug("file server addr:", fileServerAddr)

	setFunctions(ui)

	<-ui.Done()
}

func startFileServer() (string, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		logger.Error("listen error:", err)
		return "", err
	}

	go func() {
		err := http.Serve(ln, &prjFileHandler)
		if err != nil {
			logger.Error("serve error:", err)
		}
	}()

	return ln.Addr().String(), nil
}

func setFunctions(ui lorca.UI) {
	ui.Bind("goSelectDir", func() Ret {
		db := dialog.Directory()
		if record.LastDir != "" {
			db.SetStartDir(record.LastDir)
		}

		dir, err := db.Browse()
		if err != nil {
			return Ret{
				Error: err.Error(),
			}
		}
		return Ret{
			Data: dir,
		}
	})

	ui.Bind("goCreateProject", func(dir, name string) (ret Ret) {
		err := createProject(dir, name)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = curPrj.name
		return
	})

	ui.Bind("goOpenProject", func() (ret Ret) {
		name, _ := dialog.File().Filter("cx project", string([]byte(prj_sfx)[1:])).Load()
		if name == "" {
			ret.Error = "cancel"
			return
		}

		err := openProject(name)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = curPrj.name
		return
	})

	ui.Bind("goListFiles", func(dir, click string) (ret Ret) {
		dir, files := curPrj.listFiles(dir, click)
		ret.Data = map[string]any{
			"dir": dir, "files": files,
		}
		return
	})

	ui.Bind("goCreateFolder", func(dir, name string) (ret Ret) {
		err := curPrj.createFolder(dir, name)
		if err != nil {
			ret.Error = err.Error()
		}

		return
	})

	ui.Bind("goAddFile", func(dir string) (ret Ret) {
		name, err := dialog.File().Load()
		if err != nil {
			ret.Error = err.Error()
			return
		}

		err = curPrj.addFile(dir, name)
		if err != nil {
			ret.Error = err.Error()
		}

		return
	})

	ui.Bind("goLoadImage", func(name string) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		slice, err := os.ReadFile(name)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = png_data_pfx + base64.StdEncoding.EncodeToString(slice)
		return
	})

	ui.Bind("goSaveImage", func(name, data string) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		os.Remove(name)
		f, err := os.Create(name)
		if err != nil {
			ret.Error = err.Error()
			return
		}
		defer f.Close()

		index := strings.Index(data, ",")
		dec := base64.NewDecoder(base64.StdEncoding, strings.NewReader(data[index+1:]))
		_, err = io.Copy(f, dec)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		return
	})

	ui.Bind("goGetFileServerAddr", func() string {
		return fileServerAddr
	})

	ui.Bind("goSplitMapTiles", func(name string, tileWidth, tileHeight int) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		info, err := splitMapTiles(name, tileWidth, tileHeight)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = map[string]any{
			"data":     png_data_pfx + base64.StdEncoding.EncodeToString(info.Data),
			"width":    info.Width,
			"height":   info.Height,
			"interval": map_tile_interval,
		}

		return
	})

	ui.Bind("goLoadMap", func(name string, size, width, height int) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		slice, err := os.ReadFile(name)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		mapData := png_data_pfx + base64.StdEncoding.EncodeToString(slice)

		slice, err = createMapTileBg(size, width, height)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		tilesData := png_data_pfx + base64.StdEncoding.EncodeToString(slice)

		ret.Data = map[string]any{
			"map":   mapData,
			"tiles": tilesData,
		}

		return
	})

	ui.Bind("goCreateFile", func(name, data string, bin bool) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		err := createFile(name, data, bin)
		if err != nil {
			ret.Error = err.Error()
		}

		return
	})

	ui.Bind("goDeleteFile", func(name string) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		err := os.Remove(name)
		if err != nil {
			ret.Error = err.Error()
		}

		return
	})

	ui.Bind("goReadFile", func(name string, bin bool) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		data, err := readFile(name, bin)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = data
		return
	})

	ui.Bind("goRevealInExplorer", func(name string) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		name = filepath.FromSlash(name)
		cmd := exec.Command("explorer.exe", name)
		err := cmd.Run()
		if err != nil {
			ret.Error = err.Error()
		}

		logger.Debug("explorer done")

		return
	})

	ui.Bind("goCreateAtlasPics", func(name string, items []AtlasItem) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		picMap, err := createAtlasPics(name, items)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = picMap
		return
	})

	ui.Bind("goCombineTiles", func(name string, tileWidth, tileHeight int, tiles []Tile) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		picStr, err := combineTiles(name, tileWidth, tileHeight, tiles)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		ret.Data = picStr
		return
	})

	ui.Bind("goSaveTileMapSelect", func(name string, tileWidth, tileHeight int, tiles []TileInfo) (ret Ret) {
		name = path.Join(curPrj.rootDir, name)
		image := combineTileMapSelect(curPrj.rootDir, tileWidth, tileHeight, tiles)

		os.Remove(name)

		f, err := os.OpenFile(name, os.O_SYNC|os.O_RDWR|os.O_CREATE, 0666)
		if err != nil {
			ret.Error = err.Error()
			return
		}
		defer f.Close()

		err = png.Encode(f, image)
		if err != nil {
			ret.Error = err.Error()
			return
		}

		return
	})
}
