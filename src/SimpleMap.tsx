import { LatLng } from "leaflet";
import React, { useState } from "react";
import { MapContainer, TileLayer } from 'react-leaflet'
import EditableMarker, { MarkerData } from './Marker'

export interface Markers {
    [index: string]: MarkerData;
}

//import ReactDom from "react-dom";

export default (props: {"markers": Markers, "editable": boolean}) => {
    const [position, setPosition] = useState(new LatLng(52.520008, 13.404954));
    return <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="simple-map-container">
        <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
            {Object.entries(props.markers).map(([_key, markerData]) => <EditableMarker {...markerData}/>)}
        </MapContainer>
};

