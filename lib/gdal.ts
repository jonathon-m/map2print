import gdal from "gdal";

export function toGeoJson(srcPath: string, destPath: string) {
    const dataset = gdal.open(srcPath);
    const shapefile = gdal.open(destPath, 'w', 'GeoJSON')
    //@ts-ignore
    const shapefileLayer = shapefile.layers.create('vector', null, gdal.MultiPolygon, [])
    shapefileLayer.fields.add(new gdal.FieldDefn('val', gdal.OFTInteger));
    const options: gdal.PolygonizeOptions = {
        src: dataset.bands.get(2),
        pixValField: 0,
        connectedness: 8,
        dst: shapefileLayer
    }
    gdal.polygonize(options)
    shapefile.close()
}
