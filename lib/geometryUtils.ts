import { lengthToDegrees } from "@turf/helpers"
import { featureCollection } from "@turf/turf"
import { extrudeGeoJSON } from "geometry-extrude"
import { Building, Feature, FeatureCollection, Point } from "../types"

const terrainHeightMultiplier = 2
const buildingHeightMultiplier = 2


export function metresToDegrees(m: number) {
    return lengthToDegrees(m, 'metres')
}

function loopBy(items: any, chunk: number, callback: (subset: Array<any>) => void) {
    const l = items.length
    let subset = []
    for (let i=0; i < l; i += chunk) {
        subset = items.slice(i, i+chunk);
        callback(subset)
    }
}


export function normalizeTerrainHeight(geojson: FeatureCollection) {
    const minVal = Math.min(...geojson.features.map((f: Feature) => f.properties.val))

    const normalizeFeatures = {
        type: "FeatureCollection",
        name: "vector",
        features: geojson.features.map((f: any) => {
            return {
                ...f,
                properties: {
                    val: (f.properties.val - minVal) * terrainHeightMultiplier,
                }
            }
        })
    }

    return normalizeFeatures
}

export function normalizeBuildingsHeight(buildings: Building[]): Building[]  {
    const minVal = Math.min(...buildings.flatMap(b => b.footprint3d.coordinates[0].flatMap((poly) => poly.map(coord => coord[2]))))

    const normalizedBuildings = buildings.map((b) => {
            return {
                ...b,
                footprint3d: {
                    ...b.footprint3d,
                    coordinates: [b.footprint3d.coordinates[0].map(poly => poly.map(([x, y, z]) =>  [ x, y, (z-minVal) * terrainHeightMultiplier] as [number, number, number]))]
                }
            }
        })

    return normalizedBuildings
}

export function centreGeoJSON(geojson: any, centre: Point, radius: number) {


    const sideLengthMetres = radius * 2
    const metresPerPixel = sideLengthMetres / 400

    const degreesOffset = metresToDegrees(radius)

    const nw: Point = [
        centre[0] + degreesOffset,
        centre[1] - degreesOffset,
    ]

    const translate = (point: Point) => {
        return [
            nw[0] - metresToDegrees(point[0] * metresPerPixel),
            nw[1] + metresToDegrees(point[1] * metresPerPixel),
        ]
    }

    const centeredFeatures = {
        type: "FeatureCollection",
        name: "vector",
        features: geojson.features.map((f: any) => {
            return {
                ...f,
                geometry: {
                    ...f.geometry,
                    coordinates: [
                        f.geometry.coordinates[0].map((c: Point) => {
                            return translate(c)
                        })
                    ]
                }
            }
        })
    }

    return centeredFeatures
}

export function buildingsToFeatureCollection(buildings: Building[]) {
    const geojson = buildings.reduce((featureCollection: FeatureCollection, building: Building) => {
        featureCollection.features.push({ 
            geometry: {
                type: 'MultiPolygon',
                coordinates: [building.footprint3d.coordinates[0].map((poly) => (poly.map(([x, y, _]) => [x, y])))],
            }, 
            properties: { val: (building.averageEaveHeight + building.footprint3d.coordinates[0][0][0][2]) }})
        return featureCollection
    }, { 
        type: "FeatureCollection",

        features: []
     })
     return geojson
}

export default function featureCollectionToObj(geojson: any): string {

    const { polygon } = extrudeGeoJSON(
        // Extrude geojson with Polygon/LineString/MultiPolygon/MultiLineString geometries.
        geojson,
        // Options of extrude
        {
            scale: [25000, 25000],
            depth: (feature: any) => feature.properties.val
        }
    )
    
    let obj: string[] = []
    
    loopBy(polygon.position, 3, (subset) => {
        obj.push(`v ${subset.join(' ')}`)
    })
    
    loopBy(polygon.indices, 3, (subset) => {
        obj.push(`f ${subset.map(i => i+1).join(' ')}`)
    })
    
    return obj.join('\n')
}

export function combineFeatures(fc1: Feature[], fc2: Feature[]) {
    //@ts-ignore
    return featureCollection([...fc1,...fc2]);
}