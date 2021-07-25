import { LatLng } from "leaflet";
import React, { useState } from "react";
import { Marker, Popup } from "react-leaflet";

export interface MarkerData {
    title: string, 
    lat: number,
    long: number
}

export default (props: MarkerData) => {
    const [position, setPosition] = useState(new LatLng(props.lat, props.long))
    const [title, setTitle] = useState(props.title) 

    return <Marker position={position}>
        <Popup>
            <h3>{title}</h3>
            A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
     </Marker>
   
}

