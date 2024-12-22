package main

import (
	"bvUtils/file"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	"github.com/flytam/filenamify"
)

const (
	prj_sfx = ".cxp"
)

type Project struct {
	name    string
	rootDir string

	fileHandler http.Handler
}

var curPrj Project

func createProject(dir, name string) error {
	safeName, err := filenamify.Path(name, filenamify.Options{})
	if err != nil {
		return err
	}

	if safeName != name {
		return errors.New("name error")
	}

	if !file.IsDir(dir) {
		return errors.New("dir error")
	}

	name = path.Join(dir, name)
	err = os.Mkdir(name, 0755)
	if err != nil {
		return err
	}

	srcName := path.Join(name, "src")
	err = os.Mkdir(srcName, 0755)
	if err != nil {
		return err
	}

	assetName := path.Join(name, "asset")
	err = os.Mkdir(assetName, 0755)
	if err != nil {
		return err
	}

	prjInfo := map[string]any{
		"CreateTime": time.Now().Format("2006-01-02 15:04:05"),
	}

	slice, err := json.Marshal(prjInfo)
	if err != nil {
		return err
	}

	err = os.WriteFile(path.Join(name, safeName+prj_sfx), slice, 0755)
	if err != nil {
		return err
	}

	projectInit(name, safeName)
	return nil
}

func openProject(name string) error {
	name = filePath2Path(name)

	if path.Ext(name) != prj_sfx {
		return errors.New("name error")
	}

	prjName := path.Base(name)
	index := strings.LastIndex(prjName, prj_sfx)
	prjName = string([]byte(prjName)[:index])

	projectInit(path.Join(path.Dir(name), "dev"), prjName)
	return nil
}

func projectInit(dirName, name string) {
	curPrj.rootDir = dirName
	curPrj.name = name

	record.updateLastDir(path.Clean(path.Join(dirName, "..")))

	curPrj.fileHandler = http.FileServer(http.Dir(dirName))
}

func (prj *Project) listFiles(dir, click string) (string, []FileInfo) {
	if click != "" {
		dir = path.Join(dir, click)
	}

	return dir, prj.getFilesInfo(dir)
}

func (prj *Project) getFilesInfo(dir string) []FileInfo {
	var files []FileInfo

	if dir == "." {
		files = getFiles(prj.rootDir, false)
	} else {
		files = getFiles(path.Join(prj.rootDir, dir), true)
	}

	return files
}

func (prj *Project) createFolder(dir, name string) error {
	safeName, err := filenamify.Path(name, filenamify.Options{})
	if err != nil {
		return err
	}

	if safeName != name {
		return errors.New("name invalid")
	}

	pathName := path.Join(curPrj.rootDir, dir, name)
	if file.Exists(pathName) {
		return errors.New("name duplicate")
	}

	return os.Mkdir(pathName, 0755)
}

func (prj *Project) addFile(dir, name string) error {
	dstFile := path.Join(prj.rootDir, dir, path.Base(name))
	if dstFile == name {
		return errors.New("file duplicate")
	}

	fin, err := os.Open(name)
	if err != nil {
		return err
	}
	defer fin.Close()

	fout, err := os.Create(dstFile)
	if err != nil {
		return err
	}
	defer fout.Close()

	_, err = io.Copy(fout, fin)
	return err
}
