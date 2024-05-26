type OSMObjType = "node" | "way" | "relation";
export type OSMGeometry = {
    lat: number;
    lon: number;
}
type OSMMember = {
    type: OsmObj;
    geometry?: OSMGeometry[];
}

export type OsmObj = {
    type: OSMObjType;
    tags?: {
        amenity?: string;
        name?: string;
    };
    lat: number;
    lon: number;
    center?: { lat: number; lon: number };
    geometry?: OSMGeometry[];
    members?: OSMMember[];
};