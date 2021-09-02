import "leaflet/dist/leaflet.css";
import L from "leaflet";

import React from "react";
import ReactDom from "react-dom";
import "./index.css";
import SimpleMap, { Markers } from "./SimpleMap";
import APIHandler, {
    Endpoint,
    ENDPOINTS,
    EndpointUrls,
    APIContext,
} from "./handlers";

interface InitArgs {
    marker_image_path: string;
    marker_icon: string;
    markers: Markers;
    editable: boolean;
    center_lat: number;
    center_long: number;
    initial_zoom: number;
}

export default function SimpleMapApp(
    runtime: any,
    element: any,
    json_args: InitArgs
) {
    console.info("Got json args from server: ", json_args);
    L.Icon.Default.prototype.options.imagePath = json_args.marker_image_path;

    const endpointUrls = Object.fromEntries(
        ENDPOINTS.map((endpoint) => {
            return [endpoint, runtime.handlerUrl(element, endpoint) as string];
        })
    ) as EndpointUrls;

    const apiHandler = new APIHandler(endpointUrls);

    ReactDom.render(
        <APIContext.Provider value={apiHandler}>
            <SimpleMap
                center_lat={json_args.center_lat}
                center_long={json_args.center_long}
                editable={json_args.editable}
                markers={json_args.markers}
                initial_zoom={json_args.initial_zoom}
            />
        </APIContext.Provider>,
        element
    );
}

declare global {
    interface Window {
        SimpleMapXBlock: (
            _runtime: any,
            element: any,
            json_args: InitArgs
        ) => void;
    }
}

// needed so that the xblock fragment api finds this xblock
window.SimpleMapXBlock = SimpleMapApp;
