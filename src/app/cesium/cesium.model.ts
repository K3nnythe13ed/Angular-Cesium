export class CoordinateSearchResult {
    totalCount: number = 0;
    items: ModelLocation[] = [];
}

export class ModelLocation{
    id: number = 0;
    exp: number = 0;
    lat: number = 0;
    lon: number = 0;
    risk: number = 0;
    name: string = '*';
}

export class VesselList{
    vessel: Vessel[] = [];
}

export class Vessel{
    source: any;
}

export class CZMLObject{
    id: number;
    name: string;
    description: string;
    billboard: any;
    position:{
        interpolationAlgorithm: string;
        interpolationDegree : number,
        cartesian: any [];
    }
}

export class CZMLArray{
    czml: CZMLObject[] = [];
}