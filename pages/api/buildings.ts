// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Building, BuildingsResponseData, Feature, FeatureCollection } from '../../types'
import fs from 'fs'
import { buildingsToFeatureCollection, normalizeBuildingsHeight } from '../../lib/geometryUtils';

const geoscapeRequestOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: process.env.GEOSCAPE_KEY as string
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BuildingsResponseData>
) {
  let buildings = []
  if (parseInt(process.env.BYPASS_GEOSCAPE as string)) {
    console.log("Bypassing geoscape request... ")
    buildings = await getFakeBuildings(req)
  } else {
    buildings = await getGeoscapeBuildings(req)
  }

  res.status(200).json({ buildings })
}

async function getGeoscapeBuildings(req: NextApiRequest): Promise<Feature[]> {
    const response = await fetch(`${process.env.GEOSCAPE_URL}/buildings?latLong=${req.query.lat},${req.query.long}&radius=300&perPage=100`, geoscapeRequestOptions)
    .then(response => response.json())


  let buildings = []

  for(const { buildingId } of response.data) {
    const building = await fetch(`${process.env.GEOSCAPE_URL}/buildings/${buildingId}?include=footprint3d,averageEaveHeight`, geoscapeRequestOptions)
    .then(response => response.json())
    buildings.push(building)
  }
  buildings = normalizeBuildingsHeight(buildings)
  const buildingsFC = buildingsToFeatureCollection(buildings)
  return buildingsFC.features
}

async function getFakeBuildings(req: NextApiRequest): Promise<Feature[]> {

  const initialLatLong = [-35.3217767033581, 149.14685651385764]
  console.log(req.query)

  const data: any = fs.readFileSync('fixtures/buildings.json')
  const buildings: Feature[]  = buildingsToFeatureCollection(JSON.parse(data)).features;
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(buildings)
    }, 2000)
  })
}
