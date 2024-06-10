import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import FilterForm from "../filter-form/filter-form";
import styles from "./map.module.css";
import { OSMGeometry, OsmObj } from "../osm-obj";
import { point, bbox, booleanPointInPolygon, lineString, bboxPolygon, getCoord, area } from "@turf/turf";
import Loader from "../loader/loader";




type HeatLatLngTuple = [number, number, number];
type LatLngDistTuple = [number, number, number];
export type OptionType = "parks" | "schools" | "health" | "eat" | "industrial" | "kindergarten" | "transport_steps";
// type JSONOsmObj = { elements: OsmObj[] };
const areas: [] = [];
const MAX_DATA_TTL = 120000;
const CENTER_COORDS = "56.837333,60.595438";
const INTENSITY = 0.05;

const Heatmap = ({ data }: { data: HeatLatLngTuple[] }) => {
  const map = useMap();

  useEffect(() => {
    const heatLayer = L.heatLayer(data, { radius: 60, blur: 98, maxZoom: 18 });
    heatLayer.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [data, map]);

  return null;
};

function calculatePointCount(x: number) {
    const maxInput = 30000000; // Максимальное значение x
    const maxValue = 1000; // Значение функции при x = maxInput
    const count = Math.round((maxValue / Math.log(maxInput + 1)) * Math.log(x + 1));
    console.log(count);
    return count;
  }

function generatePointsInPolygon(osmPolygon: OSMGeometry[], intensity: number): HeatLatLngTuple[] {
    const points: HeatLatLngTuple[] = [];
    const restrictionBoxInput = [];
    osmPolygon.forEach((geom) => restrictionBoxInput.push([geom.lat, geom.lon]))
    // console.log(restrictionBoxInput);
    const restrictionBox = bbox(lineString(restrictionBoxInput));
    // console.log(restrictionBox);
    const [minLng, minLat, maxLng, maxLat] = restrictionBox;
    const polygonArea = area(bboxPolygon(restrictionBox));
    const numPoints: number = calculatePointCount(polygonArea);

    while (points.length < numPoints) {
        // console.log(points, numPoints);
        const lng = Math.random() * (maxLng - minLng) + minLng; // Генерация случайной долготы
        const lat = Math.random() * (maxLat - minLat) + minLat; // Генерация случайной широты
        const currentPoint = point([lng, lat]);
        // console.log(currentPoint);
        // console.log(restrictionBox);
        
       
        if (booleanPointInPolygon(currentPoint, bboxPolygon(restrictionBox))) {
            points.push([...getCoord(currentPoint), intensity]);
        }
        areas.push([area(bboxPolygon(restrictionBox)), restrictionBox[0], restrictionBox[1], restrictionBox[2], restrictionBox[3], numPoints]);
        // console.log(points);
    }

    return points;
}

function isPointInsidePolygon(polygon: OSMGeometry[], point: OSMGeometry): boolean {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lon, yi = polygon[i].lat;
      const xj = polygon[j].lon, yj = polygon[j].lat;

      const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
          (point.lon < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
  }
  return isInside;
}

function generatePointsOutsidePolygon(polygon: OSMGeometry[], k: number, m: number, n: number, intensity: number): HeatLatLngTuple[] {
  const generatedPoints: HeatLatLngTuple[] = [];

  function getRandomPointNear(p: OSMGeometry, minDistance: number, maxDistance: number): OSMGeometry {
      const angle = Math.random() * 2 * Math.PI;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      const earthRadius = 6371e3; // радиус Земли в метрах

      const newLat = p.lat + (distance / earthRadius) * (180 / Math.PI) * Math.sin(angle);
      const newLon = p.lon + (distance / earthRadius) * (180 / Math.PI) * Math.cos(angle) / Math.cos(p.lat * Math.PI / 180);

      return {
          lat: newLat,
          lon: newLon
      };
  }

  for (const point of polygon) {
      let pointsGenerated = 0;
      while (pointsGenerated < k) {
          const newPoint = getRandomPointNear(point, m, n);
          if (!isPointInsidePolygon(polygon, newPoint)) {
              generatedPoints.push([newPoint.lat, newPoint.lon, intensity]);
              pointsGenerated++;
          }
      }
  }

  return generatedPoints;
}

export const Map = () => {
  const [heatmapData, setHeatmapData] = useState<HeatLatLngTuple[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<OptionType[]>([]);
  const [selectedOptionsWeight, setSelectedOptionsWeight] = useState<Record<OptionType, number>>({
    parks: 1,
    schools: 1,
    health: 1,
    eat: 1,
    industrial: 1,
    kindergarten: 1,
    transport_steps: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
//   const optionFiles: Record<string, string> = {
//     schools: "schools.json",
//     parks: "parks2.json",
//     health: "health.json",
//     eat: "eat.json",
//     industrial: "industrial.json"
//   };
  const basePath = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=`;


  const optionPaths: Record<string, string> = {
    schools: `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
    (
      node["amenity"="school"](area.searchArea);
      way["amenity"="school"](area.searchArea);
      relation["amenity"="school"](area.searchArea);
    );
    out center;
    `,
    parks: `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
    (
      node["leisure"="park"](area.searchArea);
      way["leisure"="park"](area.searchArea);
      relation["leisure"="park"](area.searchArea);
      node["leisure"="nature_reserve"](area.searchArea);
      way["leisure"="nature_reserve"](area.searchArea);
      relation["leisure"="nature_reserve"](area.searchArea);
      way["highway"="pedestrian"](area.searchArea);
      way["area"="yes"]["highway"="pedestrian"](area.searchArea);
    );
    out geom;
    `,
    health: `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
    (
      node["amenity"="clinic"]["name"~"№"](area.searchArea);
      node["amenity"="hospital"]["name"~"№"](area.searchArea);
      way["amenity"="clinic"]["name"~"№"](area.searchArea);
      way["amenity"="hospital"]["name"~"№"](area.searchArea);
      relation["amenity"="clinic"]["name"~"№"](area.searchArea);
      relation["amenity"="hospital"]["name"~"№"](area.searchArea);
    );
    out center;
    `,
    eat: `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
    (
    node["amenity"="cafe"](area.searchArea);
    node["amenity"="restaurant"](area.searchArea);
    node["amenity"="fast_food"](area.searchArea);
    way["amenity"="cafe"](area.searchArea);
    way["amenity"="restaurant"](area.searchArea);
    way["amenity"="fast_food"](area.searchArea);
    relation["amenity"="cafe"](area.searchArea);
    relation["amenity"="restaurant"](area.searchArea);
    relation["amenity"="fast_food"](area.searchArea);
    );
    out center;
    `,
    industrial: 
    `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
    (
    node["landuse"="industrial"](area.searchArea);
    way["landuse"="industrial"](area.searchArea);
    relation["landuse"="industrial"](area.searchArea);
    node["landuse"="brownfield"](area.searchArea);
    way["landuse"="brownfield"](area.searchArea);
    relation["landuse"="brownfield"](area.searchArea);
    node["landuse"="landfill"](area.searchArea);
    way["landuse"="landfill"](area.searchArea);
    relation["landuse"="landfill"](area.searchArea);
    node["landuse"="quarry"](area.searchArea);
    way["landuse"="quarry"](area.searchArea);
    relation["landuse"="quarry"](area.searchArea);
    );
    out geom;
    `,
    kindergarten:
    `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
    (
      node["amenity"="kindergarten"]["name"~"№"](area.searchArea);
      way["amenity"="kindergarten"]["name"~"№"](area.searchArea);
      relation["amenity"="kindergarten"]["name"~"№"](area.searchArea);
    );
    out center;    
    `,
    transport_steps:
    `
    [out:json];
    area[name="Екатеринбург"]->.searchArea;
      (
      node["public_transport"="stop_position"](area.searchArea)["bench"!="yes"];
      node["railway"="tram_stop"](area.searchArea)["bench"!="yes"];
      );
    out center;
    `
  }

  const schoolHandler = async (): Promise<HeatLatLngTuple[]> => {
    const schoolLocalStorageData = getLocalStorageItem('schools');
    let data = schoolLocalStorageData;
    if (!schoolLocalStorageData) {
        const schoolPath = `${basePath}${encodeURIComponent(optionPaths['schools'])}`;
        data = await fetch(schoolPath).then((response) => {
            if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText
                );
              }
              return response.json();
        });
        setLocalStorageItem('schools', data, MAX_DATA_TTL);
    }

    const elements: Array<OsmObj> = data.elements;
    const filteredElements = elements.filter(
      (element) =>
        element.tags && element.tags.name && element.tags.name.includes("№")
    );
    const generatedSchoolPoints = generatePointsbyArchimedes(filteredElements, 300, 800);
    console.log(generatedSchoolPoints);
    const unionElements = filteredElements.concat(generatedSchoolPoints);
    console.log(unionElements);
    console.log(selectedOptionsWeight.schools);
    return countOptionHandler(unionElements, INTENSITY * selectedOptionsWeight.schools);
  };

  const parksHandler = async () => {
    const parksLocalStorageData = getLocalStorageItem('parks');
    let data = parksLocalStorageData;
    if (!parksLocalStorageData) {
        const parksPath = `${basePath}${encodeURIComponent(optionPaths['parks'])}`;
        data = await fetch(parksPath).then((response) => {
        if (!response.ok) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          return response.json();
        });
        setLocalStorageItem('parks', data, MAX_DATA_TTL);
    }

    const elements: Array<OsmObj> = data.elements;
    const filteredElements = elements.filter((element) => element.tags);
    // console.log(filteredElements);
    return parkOptionHandler(filteredElements, INTENSITY * selectedOptionsWeight.parks);
    // return countOptionHandler(filteredElements, 15);
  };

  const healthHandler = async () => {
    const healthLocalStorageData = getLocalStorageItem('health');
    let data = healthLocalStorageData;
    if (!healthLocalStorageData) {
        const healthPath = `${basePath}${encodeURIComponent(optionPaths['health'])}`;
        data = await fetch(healthPath).then((response) => {
            if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText
                );
              }
              return response.json();
        });
        setLocalStorageItem('health', data, MAX_DATA_TTL);
    }
    
    const elements: Array<OsmObj> = data.elements;
    const filteredElements = elements.filter(
      (element) =>
        element.tags && element.tags.name && element.tags.name.includes("№")
    );
    return countOptionHandler(filteredElements, INTENSITY * selectedOptionsWeight.health);
  };

  const eatHandler = async () => {
    const eatLocalStorageData = getLocalStorageItem('eat');
    let data = eatLocalStorageData;
    if (!eatLocalStorageData) {
        const eatPath = `${basePath}${encodeURIComponent(optionPaths['eat'])}`;
        data = await fetch(eatPath).then((response) => {
            if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText
                );
              }
              return response.json();
        });
        setLocalStorageItem('eat', data, MAX_DATA_TTL);
    }
    const elements: Array<OsmObj> = data.elements;
    const filteredElements = elements.filter(
      (element) => element.tags && element.tags.name
    );
    // console.log(countOptionHandler(filteredElements, 3));
    // console.log(greatCircle([0, 0], [100, 10]));
    // console.log(point([100, 0]));
    return countOptionHandler(filteredElements, INTENSITY * selectedOptionsWeight.eat);
  };
  
  const industrialHandler = async () => {
    const industrialLocalStorageData = getLocalStorageItem('industrial');
    let data = industrialLocalStorageData;
    if (!industrialLocalStorageData) {
        const industrialPath = `${basePath}${encodeURIComponent(optionPaths['industrial'])}`;
        data = await fetch(industrialPath).then((response) => {
            if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText
                );
              }
              return response.json();
        });
        setLocalStorageItem('industrial', data, MAX_DATA_TTL);
    }
    const elements: Array<OsmObj> = data.elements;
    const filteredElements = elements.filter((element) => element.tags);
    // console.log(filteredElements);
    return parkOptionHandler(filteredElements, INTENSITY * (-selectedOptionsWeight.industrial));
  }

  const kindergartenHandler = async () => {
    const kindergartenLocalStorageData = getLocalStorageItem('kindergarten');
    let data = kindergartenLocalStorageData;
    if (!kindergartenLocalStorageData) {
        const kindergartenPath = `${basePath}${encodeURIComponent(optionPaths['kindergarten'])}`;
        data = await fetch(kindergartenPath).then((response) => {
            if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText
                );
              }
              return response.json();
        });
        setLocalStorageItem('kindergarten', data, MAX_DATA_TTL);
    }
    const elements: Array<OsmObj> = data.elements;
    const filteredElements = elements.filter(
      (element) => element.tags && element.tags.name
    );
    const generatedKindergartenPoints = generatePointsbyArchimedes(filteredElements, 200, 400);
    console.log(generatedKindergartenPoints);
    const unionElements = filteredElements.concat(generatedKindergartenPoints);
    console.log(unionElements);
    return countOptionHandler(unionElements, INTENSITY * selectedOptionsWeight.kindergarten);
  }

  const transportStepsHandler = async () => {
    const transportStepsLocalStorageData = getLocalStorageItem('transport_steps');
    let data = transportStepsLocalStorageData;
    if (!transportStepsLocalStorageData) {
        const transportStepsPath = `${basePath}${encodeURIComponent(optionPaths['transport_steps'])}`;
        data = await fetch(transportStepsPath).then((response) => {
            if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText
                );
              }
              return response.json();
        });
        setLocalStorageItem('transport_steps', data, MAX_DATA_TTL);
    }
    
    // const elements: Array<OsmObj> = data.elements;
    const elements: Array<OsmObj> = [];
    console.log(elements);
    const filteredElements = elements.filter(
      (element) => element.tags);
    const stepsDistances: LatLngDistTuple[] = [];
    const routeUrl = `https://bbauils3a53ff0lrjhvc.containers.yandexcloud.net/get_distances`;
    const routeResponse = await fetch(routeUrl).then((response) => {
      if (!response.ok) {
        throw new Error(
          "Network response was not ok " + response.statusText
        );
       }
      return response.json();
    });
    console.log(routeResponse);
    for (let i=0; i<routeResponse.length; i++) {
      stepsDistances.push([routeResponse[i].lat, routeResponse[i].lon, routeResponse[i].dist / INTENSITY * selectedOptionsWeight.transport_steps]);
    }

    // for (let i=0; i<50; i++) {
    //   const stepCoords = `${filteredElements[i].lat},${filteredElements[i].lon}`;
    //   const routeUrl = `https://router.project-osrm.org/route/v1/driving/${stepCoords};${CENTER_COORDS}?overview=false`;
    //   console.log(routeUrl);
    //   const routeResponse = await fetch(routeUrl).then((response) => {
    //     if (!response.ok) {
    //       throw new Error(
    //         "Network response was not ok " + response.statusText
    //       );
    //     }
    //     return response.json();
    //   });
  
    console.log(stepsDistances);
    return countDistHandler(stepsDistances);
    // return countOptionHandler(filteredElements, 5);
  }

//   const generateSchoolPoints = (elements: OsmObj[], n: number, radius: number): OsmObj[] => {
//         const randomSchoolPoints: OsmObj[] = [];
//         for (let i=0; i<elements.length; i++) {
//             const currentElement = elements[i];
//             let currentPoint = [];
//             if (currentElement.center) {
//                 currentPoint = [currentElement.center.lat, currentElement.center.lon];
//               }
//             else {
//                 currentPoint = [currentElement.lat, currentElement.lon];
//             }
//             for (let j=0; j<n; j++) {
//                 const randomAngle = Math.random() * Math.PI * 2; // Случайный угол
//                 const randomRadius = Math.random() * radius; // Случайный радиус
//                 const pointLatLng = [
//                     currentPoint[0] + randomRadius * Math.cos(randomAngle) / 111300, // приблизительное преобразование
//                     currentPoint[1] + randomRadius * Math.sin(randomAngle) / (111300 * Math.cos(currentPoint[0] * Math.PI/180))];
//                 const newOsmObj: OsmObj = {
//                         type: "node",
//                         lat: pointLatLng[0],
//                         lon: pointLatLng[1]
//                 };
//                 randomSchoolPoints.push(newOsmObj);
//             }
//         }
//         return randomSchoolPoints;
//   }

  const generatePointsbyArchimedes = (elements: OsmObj[], n: number, radius: number): OsmObj[] => {
    const randomSchoolPoints: OsmObj[] = [];
    const a = 10;
    for (let i=0; i<elements.length; i++) {
        const currentElement = elements[i];
        let currentPoint = [];
        if (currentElement.center) {
            currentPoint = [currentElement.center.lat, currentElement.center.lon];
          }
        else {
            currentPoint = [currentElement.lat, currentElement.lon];
        }
        for (let j=0; j<n; j++) {
            const angle = 0.1 * j; // увеличение угла для каждой следующей точки
            const r = a * angle; // радиус зависит от угла (спираль Архимеда)
            if (r > radius) break;
            const radiusInDegrees = r / 111300; // переводим метры в градусы
            const pointLatLng = [currentPoint[0] + radiusInDegrees * Math.cos(angle), currentPoint[1] + radiusInDegrees * Math.sin(angle)];
            const newOsmObj: OsmObj = {
                    type: "node",
                    lat: pointLatLng[0],
                    lon: pointLatLng[1]
            };
            randomSchoolPoints.push(newOsmObj);
        }
    }
    return randomSchoolPoints;
  }

  const parkOptionHandler = (data: OsmObj[], k: number): HeatLatLngTuple[] => {
    const coords: HeatLatLngTuple[] = [];
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      const currentObj = data[i];
      if (currentObj.center) {
        // console.log([currentObj.center.lat, currentObj.center.lon, k])
        coords.push([currentObj.center.lat, currentObj.center.lon, k]);
      }
      if (currentObj.geometry) {
        const geometryLength = currentObj.geometry.length;
        const generatedInsidePoints = generatePointsInPolygon(currentObj.geometry, k);
        const generatedOutsidePoints = generatePointsOutsidePolygon(currentObj.geometry, 50, 50, 500, k / 2);
        console.log(generatedInsidePoints.length, generatePointsOutsidePolygon.length);
        const unionPoints = generatedInsidePoints.concat(generatedOutsidePoints);
        // console.log(generatedPoints);
        for (let nodeIndex = 0; nodeIndex < geometryLength; nodeIndex++) {
          const lat = currentObj.geometry[nodeIndex].lat;
          const lon = currentObj.geometry[nodeIndex].lon;
        //   console.log([lat, lon, k]);
          lat !== undefined && lon !== undefined && coords.push([lat, lon, k]);
        }
        unionPoints.forEach((point) => {
            // console.log(point);
            coords.push(point)});
      }
      if (currentObj.members) {
        const members = currentObj.members;
        for (let memberIndex = 0; memberIndex < members.length; memberIndex++) {
          const currentMember = members[memberIndex];
        //   console.log(currentMember);
          if (currentMember.geometry) {
            const generatedPoints = generatePointsInPolygon(currentMember.geometry, k);
            for (let nodeIndex = 0; nodeIndex < currentMember.geometry.length; nodeIndex++) {
                // console.log(currentMember);
                const lat = currentMember.geometry[nodeIndex].lat;
                const lon = currentMember.geometry[nodeIndex].lon;
                // console.log([lat, lon, k]);
                lat !== undefined && lon !== undefined && coords.push([lat, lon, k]);
            }
            generatedPoints.forEach((point) => {
                // console.log(point);
                coords.push(point)});
          }
        }
      } else if (currentObj.lat && currentObj.lon) {
        coords.push([currentObj.lat, currentObj.lon, k]);
      }
    }
    console.log(coords);
    return coords;
  };

  const countOptionHandler = (data: OsmObj[], k: number) => {
    return data.map((element): HeatLatLngTuple => {
      if (element.center) {
        return [element.center.lat, element.center.lon, k];
      }
      //   if (element.geometry) {
      //     element.geometry.map((geom) => {
      //         return [geom.lat, geom.lon, k];
      //     })
      //   }
      return [element.lat, element.lon, k];
    });
  };

  const countDistHandler = (data: LatLngDistTuple[]) => {
    return data.map((element): LatLngDistTuple => {
      const result: LatLngDistTuple = [element[0], element[1], 1 / element[2] * 10000000];
      console.log(result);
      return result;
    });
  };


  useEffect(() => {
    setHeatmapData([]);
    selectedOptions.forEach((option) => {
          if (option === "schools") {
            schoolHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
          }
          if (option === "parks") {
            parksHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
            // console.log(parksData);
            // setHeatmapData((prev) => [...prev, ...parksData]);
            // areas.sort((a, b) => b[0] - a[0]);
            // console.log(areas);
          }
          if (option === "health") {
            healthHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
          }
          if (option === "eat") {
            eatHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
          }
          if (option === "industrial") {
            industrialHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
          }
          if (option === "kindergarten") {
            kindergartenHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
          }
          if (option === "transport_steps") {
            transportStepsHandler().then((data) => setHeatmapData((prev) => [...prev, ...data]));
          }
        })
    setLoading(false);
  }, [selectedOptions, selectedOptionsWeight]);

  const getLocalStorageItem = (key: OptionType)  => {
    const localStorageItemStr = localStorage.getItem(key);
    if (!localStorageItemStr) {
        return null;
    }
    const item = JSON.parse(localStorageItemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
    return null;
    }
    return item.value;
  }

  const setLocalStorageItem = (key: OptionType, value: any, ttl: number) => {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  return (
    <div className={styles.page}>
      <MapContainer
        className={styles.map}
        center={[56.85, 60.61]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "900px", width: "900px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          minZoom={12}
          maxZoom={18}
        />
        {loading ? <Loader /> : <Heatmap data={heatmapData} />}
        {/* {heatmapData && <Heatmap data={heatmapData} />} */}
      </MapContainer>
      <FilterForm
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        selectedOptionsWeight={selectedOptionsWeight}
        setSelectedOptionsWeight={setSelectedOptionsWeight}
      ></FilterForm>
    </div>
  );
};
