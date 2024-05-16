import { Point } from "../types";
import { metresToDegrees } from "./geometryUtils";


export function buildTerrainURL(center: Point, radius: number) {

    const degreesOffset = metresToDegrees(radius)

    const ne: Point = [
        center[0] + degreesOffset,
        center[1] + degreesOffset,
    ]

    const sw: Point = [
        center[0] - degreesOffset,
        center[1] - degreesOffset,
    ]

    const bbox = ne.concat(sw).join(',')
    return `${process.env.GA_URL}${bbox}`

}



