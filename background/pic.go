package main

import (
	"bvUtils/logger"
	"bytes"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"os"
	"path"
	"reflect"
	"sort"
)

const (
	map_tile_interval = 2
)

type TileSetInfo struct {
	Width  int
	Height int
	Data   []byte
}

func splitMapTiles(name string, tileWidth, tileHeight int) (TileSetInfo, error) {
	var info TileSetInfo

	fi, err := os.Open(name)
	if err != nil {
		logger.Error("open pic file error:", err)
		return info, err
	}
	defer fi.Close()

	img, err := png.Decode(fi)
	if err != nil {
		logger.Error("png decode error:", err)
		return info, err
	}

	info.Width = img.Bounds().Dx() / tileWidth
	info.Height = img.Bounds().Dy() / tileHeight

	width, height := img.Bounds().Dx(), img.Bounds().Dy()

	newWidth := ((width+tileWidth-1)/tileWidth-1)*map_tile_interval + width
	newHeight := ((height+tileHeight-1)/tileHeight-1)*map_tile_interval + height

	splitMap := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	for i := 0; i < height; i++ {
		for j := 0; j < width; j++ {
			cl := img.At(j, i)

			x := j/tileWidth*map_tile_interval + j
			y := i/tileHeight*map_tile_interval + i

			splitMap.Set(x, y, cl)
		}
	}

	buf := bytes.Buffer{}
	err = png.Encode(&buf, splitMap)
	if err != nil {
		logger.Error("create png file error:", err)
		return info, err
	}

	info.Data = buf.Bytes()
	return info, nil
}

func createMapTileBg(tileSize, width, height int) ([]byte, error) {
	lineCol := color.RGBA{0, 0x40, 0, 0xff}

	startX := (width - tileSize) / 2 % tileSize
	startY := (height - tileSize) / 2 % tileSize

	tiles := image.NewRGBA(image.Rect(0, 0, width, height))
	for i := startY; i < height; i += tileSize {
		for j := 0; j < width; j++ {
			tiles.Set(j, i, lineCol)
		}
	}

	for i := startX; i < width; i += tileSize {
		for j := 0; j < height; j++ {
			tiles.Set(i, j, lineCol)
		}
	}

	buf := bytes.Buffer{}
	err := png.Encode(&buf, tiles)
	if err != nil {
		logger.Error("create png file error:", err)
		return nil, err
	}

	return buf.Bytes(), nil
}

type AtlasFrame struct {
	X int
	Y int
	W int
	H int
}

type AtlasItem struct {
	FileName string
	Frame    AtlasFrame
}

func createAtlasPics(name string, items []AtlasItem) (map[string]string, error) {
	fi, err := os.Open(name)
	if err != nil {
		logger.Error("open pic file error:", err)
		return nil, err
	}
	defer fi.Close()

	img, err := png.Decode(fi)
	if err != nil {
		logger.Error("png decode error:", err)
		return nil, err
	}

	picMap := make(map[string]string)
	for _, v := range items {
		pic := image.NewRGBA(image.Rect(0, 0, v.Frame.W, v.Frame.H))
		for i := 0; i < pic.Rect.Dy(); i++ {
			for j := 0; j < pic.Rect.Dx(); j++ {
				pic.Set(j, i, img.At(v.Frame.X+j, v.Frame.Y+i))
			}
		}

		buf := bytes.Buffer{}
		err := png.Encode(&buf, pic)
		if err != nil {
			logger.Error("create png file error:", err)
			return nil, err
		}

		picMap[v.FileName] = png_data_pfx + base64.StdEncoding.EncodeToString(buf.Bytes())
	}

	return picMap, nil
}

type Tile struct {
	X int
	Y int
}

func combineTiles(name string, tileWidth, tileHeight int, tiles []Tile) (string, error) {
	fi, err := os.Open(name)
	if err != nil {
		logger.Error("open pic file error:", err)
		return "", err
	}
	defer fi.Close()

	img, err := png.Decode(fi)
	if err != nil {
		logger.Error("png decode error:", err)
		return "", err
	}

	minX, minY, maxX, maxY := getTilesRange(tiles)
	width := (maxX + 1 - minX) * tileWidth
	height := (maxY + 1 - minY) * tileHeight

	pic := image.NewRGBA(image.Rect(0, 0, width, height))

	for _, v := range tiles {
		outX := (v.X - minX) * tileWidth
		outY := (v.Y - minY) * tileHeight

		bigX := v.X * tileWidth
		bigY := v.Y * tileHeight

		for y := 0; y < tileHeight; y++ {
			for x := 0; x < tileWidth; x++ {
				pic.Set(outX+x, outY+y, img.At(bigX+x, bigY+y))
			}
		}
	}

	buf := bytes.Buffer{}
	err = png.Encode(&buf, pic)
	if err != nil {
		logger.Error("create png file error:", err)
		return "", err
	}

	return png_data_pfx + base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

type TileInfo struct {
	Tile
	TileSetName string
	TileSetX    int
	TileSetY    int
	Depth       int
	Alpha       float64
}

func combineTileMapSelect(baseDir string, tileWidth, tileHeight int, tiles []TileInfo) image.Image {
	sort.Slice(tiles, func(i, j int) bool {
		return tiles[i].Depth <= tiles[j].Depth
	})

	minX, minY, maxX, maxY := getTilesRange(tiles)
	width := (maxX + 1 - minX) * tileWidth
	height := (maxY + 1 - minY) * tileHeight

	pic := image.NewRGBA(image.Rect(0, 0, width, height))
	tileSets := make(map[string]image.Image)

	for _, v := range tiles {
		if v.Alpha == 0 {
			continue
		}

		image, ok := tileSets[v.TileSetName]
		if !ok {
			fi, err := os.Open(path.Join(baseDir, v.TileSetName))
			if err != nil {
				logger.Error("open pic file error:", err)
				continue
			}

			image, err = png.Decode(fi)
			if err != nil {
				logger.Error("png decode error:", err)
				fi.Close()
				continue
			}

			fi.Close()

			tileSets[v.TileSetName] = image
		}

		outX := (v.X - minX) * tileWidth
		outY := (v.Y - minY) * tileHeight
		bigX := v.TileSetX * tileWidth
		bigY := v.TileSetY * tileHeight

		for y := 0; y < tileHeight; y++ {
			for x := 0; x < tileWidth; x++ {
				bigCl := image.At(bigX+x, bigY+y)
				bigR, bigG, bigB, bigA := bigCl.RGBA()
				if bigA == 0 {
					continue
				}

				bigA = uint32(float64(bigA) * v.Alpha)
				if bigA >= 0xffff {
					pic.Set(outX+x, outY+y, bigCl)
				}

				alpha := float64(bigA) / float64(0xffff)
				orgAlpha := 1 - alpha

				cl := pic.At(outX+x, outY+y)
				r, g, b, a := cl.RGBA()

				r = uint32(float64(bigR)*alpha) + uint32(float64(r)*orgAlpha)
				g = uint32(float64(bigG)*alpha) + uint32(float64(g)*orgAlpha)
				b = uint32(float64(bigB)*alpha) + uint32(float64(b)*orgAlpha)

				if bigA > a {
					a = bigA
				}

				pic.Set(outX+x, outY+y, color.RGBA64{
					R: uint16(r), G: uint16(g), B: uint16(b), A: uint16(a),
				})
			}
		}
	}

	return pic
}

func getTilesRange(arr any) (int, int, int, int) {
	var minX, minY, maxX, maxY int

	value := reflect.ValueOf(arr)
	for i := 0; i < value.Len(); i++ {
		element := value.Index(i)
		x := int(element.FieldByName("X").Int())
		y := int(element.FieldByName("Y").Int())

		if i == 0 {
			minX = x
			maxX = x
			minY = y
			maxY = y
		} else {
			if x < minX {
				minX = x
			} else if x > maxX {
				maxX = x
			}

			if y < minY {
				minY = y
			} else if y > maxY {
				maxY = y
			}
		}
	}

	return minX, minY, maxX, maxY
}
