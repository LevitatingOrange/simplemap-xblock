import { LatLng } from "leaflet";
import React, { useState, useContext } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import EditableMarker, { MarkerData } from "./Marker";
import APIHandler, { APIContext } from "./handlers";
import { FaMapMarkerAlt, FaCompass, FaLock, FaLockOpen } from "react-icons/fa";

export interface Markers {
    [index: string]: MarkerData;
}

const EditorControls = (props: {
    editable: boolean;
    initial_editable: boolean;
    add_marker: (data: MarkerData) => void;
    set_editable: (data: boolean) => void;
}) => {
    const apiHandler = useContext(APIContext);
    const map = useMap();

    const set_center = async () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        if (!props.editable) {
            console.error("Set center called even though not in edit mode");
            return;
        }
        try {
            const response = await apiHandler.post("set_center", {
                lat: center.lat,
                long: center.lng,
                zoom: zoom,
            });
            if (response?.data.success) {
                console.info(
                    "Position data has been accepted, response was: ",
                    response
                );
            } else {
                console.error(
                    "Position data has not been accepted, response was:",
                    response
                );
                return;
            }
        } catch (error) {
            console.error("Could not set center:", error);
            return;
        }
    };
    if (props.initial_editable) {
        return (
            <div className="leaflet-bottom leaflet-left">
                <div className="leaflet-control leaflet-bar additional-map-controls">
                    {props.editable && (
                        <a
                            role="button"
                            href="#"
                            aria-label="Add new marker"
                            onClick={() =>
                                props.add_marker({
                                    title: "New marker",
                                    content: "",
                                    lat: map.getCenter().lat,
                                    long: map.getCenter().lng,
                                })
                            }
                        >
                            <FaMapMarkerAlt />
                        </a>
                    )}
                    {props.editable && (
                        <a
                            role="button"
                            href="#"
                            aria-label="Set zoom and center on map"
                            onClick={set_center}
                        >
                            <FaCompass />
                        </a>
                    )}
                    <a
                        role="button"
                        href="#"
                        aria-label="Toggle editable"
                        onClick={() => props.set_editable(!props.editable)}
                    >
                        {props.editable ? <FaLock /> : <FaLockOpen />}
                    </a>
                </div>
            </div>
        );
    } else {
        return <div></div>;
    }
};

//import ReactDom from "react-dom";

export default (props: {
    center_lat: number;
    center_long: number;
    initial_zoom: number;
    markers: Markers;
    editable: boolean;
}) => {
    const apiHandler = useContext(APIContext);

    const [markers, setMarkers] = useState(props.markers);
    const [editable, setEditable] = useState(props.editable);

    const add_marker = async (data: MarkerData) => {
        if (!editable) {
            console.error("Add marker called even though not in edit mode");
            return;
        }
        try {
            const response = await apiHandler.post("add_marker", data);
            if (response && response.data.success) {
                console.info("Add has been accepted, response was: ", response);
                let new_markers = { ...markers };
                new_markers[response.data.marker_id] = data;
                setMarkers(new_markers);
            } else {
                console.error(
                    "Marker data has not been accepted, response was:",
                    response
                );
                return;
            }
        } catch (error) {
            console.error("Could not push new marker data:", error);
            return;
        }
    };

    const delete_marker = async (marker_id: string) => {
        if (!editable) {
            console.error("Delete marker called even though not in edit mode");
            return;
        }
        try {
            const response = await apiHandler.post("delete_marker", {
                marker_id: marker_id,
            });
            if (response?.data.success) {
                console.info(
                    "Delete has been accepted, response was: ",
                    response
                );
            } else {
                console.error(
                    "Marker data has not been accepted, response was:",
                    response
                );
                return;
            }
        } catch (error) {
            console.error("Could not push new marker data:", error);
            return;
        }
        //[FIXME] does not work

        setMarkers(
            Object.fromEntries(
                Object.entries(markers).filter(
                    ([this_marker_id, _]) => this_marker_id != marker_id
                )
            )
        );
    };

    return (
        <MapContainer
            center={new LatLng(props.center_lat, props.center_long)}
            zoom={props.initial_zoom}
            scrollWheelZoom={false}
            className="simple-map-container"
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.entries(markers).map(([marker_id, markerData]) => (
                <EditableMarker
                    key={marker_id}
                    marker_id={marker_id}
                    editable={editable}
                    delete_marker={delete_marker}
                    {...markerData}
                />
            ))}
            <EditorControls
                editable={editable}
                initial_editable={props.editable}
                add_marker={add_marker}
                set_editable={setEditable}
            />
        </MapContainer>
    );
};
