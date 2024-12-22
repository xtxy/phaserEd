package main

import (
	"bvUtils/logger"
	"encoding/base64"
	"os"
	"sort"
	"strings"
)

type FileInfo struct {
	Name string
	Dir  bool
}

func getFiles(dirPath string, withParent bool) []FileInfo {
	dir, err := os.ReadDir(dirPath)
	if err != nil {
		logger.Error("read dir error:", dirPath, err)
		return nil
	}

	var ret []FileInfo
	if withParent {
		ret = append(ret, FileInfo{Name: "..", Dir: true})
	}

	for _, v := range dir {
		name := v.Name()
		if v.IsDir() {
			ret = append(ret, FileInfo{Name: name, Dir: true})
		} else {
			ret = append(ret, FileInfo{Name: name, Dir: false})
		}
	}

	sort.Slice(ret, func(i, j int) bool {
		if ret[i].Dir && !ret[j].Dir {
			return true
		} else if !ret[i].Dir && ret[j].Dir {
			return false
		}

		return ret[i].Name <= ret[j].Name
	})

	return ret
}

func createFile(fileName, data string, bin bool) error {
	os.Remove(fileName)

	if len(data) == 0 {
		fi, err := os.Create(fileName)
		if err != nil {
			logger.Error("create file error:", err)
			return err
		}

		fi.Close()
		return nil
	}

	var slice []byte
	var err error

	if bin {
		slice, err = base64.StdEncoding.DecodeString(data)
		if err != nil {
			return err
		}
	} else {
		slice = []byte(data)
	}

	return os.WriteFile(fileName, slice, 0755)
}

func readFile(fileName string, bin bool) (string, error) {
	slice, err := os.ReadFile(fileName)
	if err != nil {
		return "", err
	}

	var data string

	if bin {
		data = base64.StdEncoding.EncodeToString(slice)
	} else {
		data = string(slice)
	}

	return data, nil
}

func filePath2Path(filePath string) string {
	return strings.ReplaceAll(filePath, "\\", "/")
}
