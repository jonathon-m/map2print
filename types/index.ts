
export type Building = {
  footprint3d: {
      coordinates: [number, number, number][][][]
    }
    averageEaveHeight: number
  }
  
export type BuildingsResponseData = {
    buildings: Feature[]
  }

export type TerrainResponseData = {
    terrain: Feature[]
  }

export type FeatureCollection = { 
    type: string,
    name?: string,
    features: Feature[]
 }

 export type Feature = {
    type?: String,
    properties: {
        val: number
    },
    geometry: {
        type?: string
        coordinates: [number, number, number?][][][]
    }
 }

 export type Point = [number, number]