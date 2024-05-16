import fs from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { centreGeoJSON, normalizeTerrainHeight } from '../../lib/geometryUtils'
import { toGeoJson } from '../../lib/gdal'
import { buildTerrainURL } from '../../lib/mapServer'
import { TerrainResponseData } from '../../types'
import sha1 from 'sha1';
import path from 'path'
import transformRotate from '@turf/transform-rotate'


const tempImagePath = '/tmp/map2printRaster/'
if (!fs.existsSync(tempImagePath)) {
  fs.mkdirSync(tempImagePath)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TerrainResponseData>
) {
  const lat = parseFloat(req.query.lat as string)
  const long = parseFloat(req.query.long as string)
  const radius = parseInt(req.query.radius as string) * 1.2
  const hash = sha1(`${lat}${long}${radius}`);
  const imageName = path.join(tempImagePath, `${hash}.png`)
  const geojsonName = path.join(tempImagePath, `${hash}.geojson`)
  if (!fs.existsSync(imageName)) {
    const imageBlob = await fetch(buildTerrainURL([long, lat], radius)).then(response => response.arrayBuffer())
    const buffer = Buffer.from(imageBlob)
    fs.writeFileSync(imageName, buffer)
    fs.writeFileSync('fixtures/image.png', buffer)
  }

  toGeoJson(imageName, geojsonName)

  const data: any = fs.readFileSync(geojsonName)
  let terrain  = JSON.parse(data);
  terrain = centreGeoJSON(terrain, [long, lat], radius)
  terrain = normalizeTerrainHeight(terrain)
  terrain = transformRotate(terrain, 180)

  fs.writeFileSync('fixtures/centredTerrain.geojson', JSON.stringify(terrain))


  res.status(200).json({ terrain: terrain.features })
}
