import { LatLng, Marker as LMarker } from "leaflet";
import React, { useState, useMemo, useRef, useContext } from "react";
import { Marker, Popup } from "react-leaflet";
import { APIContext } from "./handlers";
import MarkerEditor from "./MarkerEditor";

export interface MarkerData {
    title: string;
    content: string;
    lat: number;
    long: number;
}

export default (
    props: {
        editable: boolean;
        marker_id: string;
        delete_marker: (marker_id: string) => void;
    } & MarkerData
) => {
    const [position, setPosition] = useState(new LatLng(props.lat, props.long));
    const markerRef = useRef(null);
    const apiHandler = useContext(APIContext);
    const eventHandlers = useMemo(
        () => ({
            async dragend() {
                const marker = markerRef.current;
                if (marker == null) {
                    console.error("Marker ref null");
                    return;
                }
                const new_pos = (marker as LMarker).getLatLng();
                if (marker != null) {
                    setPosition(new_pos);
                }
                console.info("Sending new marker data to server...");
                try {
                    const response = await apiHandler.post("change_marker", {
                        marker_id: props.marker_id,
                        lat: new_pos.lat,
                        long: new_pos.lng,
                    });
                    console.info(
                        "Marker data has been accepted, response was: ",
                        response
                    );
                } catch (error) {
                    console.error("Could not push new marker data:", error);
                }
            },
        }),
        []
    );

    return (
        <Marker
            position={position}
            draggable={props.editable}
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Popup>
                <MarkerEditor
                    marker_id={props.marker_id}
                    title={props.title}
                    content={props.content}
                    editable={props.editable}
                    delete_marker={props.delete_marker}
                />
            </Popup>
        </Marker>
    );
};
