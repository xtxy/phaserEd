package main

import (
	"net/http"
)

const (
	local_file_dir = "data"
)

type PrjFileHandler struct {
	localHandler http.Handler
}

var prjFileHandler PrjFileHandler

func (handler *PrjFileHandler) start() {
	handler.localHandler = http.FileServer(http.Dir(local_file_dir))
}

func (handler *PrjFileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	headerKind := r.Header.Get("kind")

	if headerKind == "editor" {
		handler.localHandler.ServeHTTP(w, r)
	} else {
		curPrj.fileHandler.ServeHTTP(w, r)
	}
}
