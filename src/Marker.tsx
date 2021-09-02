import { LatLng, Marker as LMarker } from "leaflet";
import React, { useState, useMemo, useRef, useContext } from "react";
import { Marker, Popup } from "react-leaflet";
import APIHandler, { APIContext } from "./handlers";
import MarkerEditor from "./MarkerEditor";
import { debounce } from "lodash";
import { FaTrashAlt, FaBold, FaItalic } from "react-icons/fa";

export interface MarkerData {
    title: string;
    content: string;
    lat: number;
    long: number;
}

const PopupEditor = (props: {
    marker_id: string;
    editable: boolean;
    title: string;
    content: string;
    delete_marker: (marker_id: string) => void;
}) => {
    const apiHandler = useContext(APIContext);
    const [title, setTitle] = useState(props.title);
    const debouncedTitleHandler = useMemo(
        () =>
            debounce(async (newTitle: string) => {
                console.info("Sending new marker data to server...");
                try {
                    const response = await apiHandler.post("change_marker", {
                        marker_id: props.marker_id,
                        title: newTitle,
                    });
                    console.info(
                        "Marker data has been accepted, response was: ",
                        response
                    );
                } catch (error) {
                    console.error("Could not push new marker data:", error);
                }
            }, 1000),
        [props.marker_id]
    );

    if (props.editable) {
        return (
            <div className="popup">
                    <input
                        className="marker-title"
                        type="text"
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value);
                            debouncedTitleHandler(event.target.value);
                        }}
                    />

                <section className="toolbar">
                      <a
                        role="button"
                        aria-label="Bold"
                        href="#"
                        onClick={() => {}}
                    >
                        <FaBold />
                    </a>
                    <a
                        role="button"
                        aria-label="Italics"
                        href="#"
                        onClick={() => {}}
                    >
                        <FaItalic />
                    </a>
                    <a
                        role="button"
                        aria-label="Delete marker"
                        href="#"
                        className="delete-button"
                        onClick={() => {
                            // TODO: better use undo pattern
                            if (
                                window.confirm(
                                    "Are you sure you want to delete this marker?"
                                )
                            ) {
                                props.delete_marker(props.marker_id);
                            }
                        }}
                    >
                        <FaTrashAlt />
                    </a>
                </section>
            </div>
        );
        //return <MarkerEditor />;
    } else {
        return (
            <div className="popup">
                <h3>{title}</h3>
                <section className="content">{props.content}</section>
            </div>
        );
    }
};

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
                <PopupEditor
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
