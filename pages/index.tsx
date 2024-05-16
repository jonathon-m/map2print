import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { SolidPolygonLayer } from '@deck.gl/layers/typed';
import { saveAs } from 'file-saver';

import Map from 'react-map-gl'
import React from 'react';
import { BuildingsResponseData, Feature, TerrainResponseData,  } from '../types';
import mapboxgl from 'mapbox-gl';
import featureCollectionToObj, { combineFeatures } from '../lib/geometryUtils';

const Home: NextPage = () => {

  const initialLatLong = [-35.3217767033581, 149.14685651385764]
  const [buildings, setBuildings] = useState<Feature[]>([])
  const [terrain, setTerrain] = useState<Feature[]>([])
  const [obj, setObj] = useState<string | undefined>()

  const buildingsLayer = new SolidPolygonLayer({
    id: 'BuildingsLayer',
    data: buildings,
    // @ts-ignore
    getPolygon: (b: Feature) => b.geometry.coordinates[0],
    filled: true,
    wireframe: true,
    lineWidthMinPixels: 1,
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    getElevation: (b: Feature) => b.properties.val,
    extruded: true,
    getFillColor: d => [60, 140, 0],
  });

  const terrainLayer = new SolidPolygonLayer({
    id: 'TerrainLayer',
    data: terrain,
    // @ts-ignore
    getPolygon: (f: Feature) => f.geometry.coordinates[0],
    filled: true,
    wireframe: true,
    lineWidthMinPixels: 1,
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    getElevation: (f: Feature) => f.properties.val,
    extruded: true,
    getFillColor: d => [60, 140, 0],

  });

  const [isLoading, setLoading] = useState(false)
  const [map, setMap] = useState<mapboxgl.Map | undefined>()
  const [latLong, setLatLong] = useState<number[]>(initialLatLong)

  const getLatLngFromMap = (map: mapboxgl.Map) => {
    return map.getCenter().toArray().reverse()
  }

  const updateData = () => {
    setLoading(true)
    setBuildings([])
    fetch(`/api/buildings?lat=${latLong[0]}&long=${latLong[1]}`)
      .then((res) => res.json())
      .then((data: BuildingsResponseData) => {
        setBuildings(data.buildings)
      })
    fetch(`/api/terrain?lat=${latLong[0]}&long=${latLong[1]}&radius=300`)
      .then((res) => res.json())
      .then((data: TerrainResponseData) => {
        setTerrain(data.terrain)
      })
  }

  useEffect(() => {
    const featureCollection = combineFeatures(buildings, terrain)
    console.log(JSON.stringify(featureCollection))
    setObj(featureCollectionToObj(featureCollection));
  }, [buildings, terrain])

  return (

    <div className={styles.container}>
      <Head>
        <title>map2print</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Map2Print
        </h1>

        <div id="map" className={styles.map}>
          <DeckGL
            initialViewState={{
              longitude: latLong[1],
              latitude: latLong[0],
              zoom: 16,
              bearing: 0,
              pitch: 60
            }}
            controller={true}
            layers={[buildingsLayer, terrainLayer]}
            onAfterRender={() => {
              setLoading(false)
            }}
            onDragEnd={() => {
              if (map) {
                setLatLong(getLatLngFromMap(map))
              }
            }}
          >
            <Map
              id="buildingsMap"
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_KEY}
              mapStyle="mapbox://styles/mapbox/streets-v9"
              onLoad={(event) => {
                setMap(event.target)
                setLatLong(getLatLngFromMap(event.target))
              }}>
            </Map>
          </DeckGL>
              <button 
                className='request-button'
                disabled={isLoading}
                onClick={updateData}
                >Request
              </button>
              <button 
                className='download-button'
                disabled={isLoading || !obj}
                onClick={() => {
                  if (obj) {
                    const blob = new Blob([obj], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, "buildings.obj");
                  }
                }}
                >Download
              </button>
              <div className='radius'>
                { isLoading && <p>Loading...</p>}
              </div>

        </div>

      </main>
    </div>

  )
}

export default Home
