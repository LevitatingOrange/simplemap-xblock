import "leaflet/dist/leaflet.css";
import L from "leaflet";

import React from "react";
import ReactDom from "react-dom";
import "./index.css";
import SimpleMap, {Markers} from './SimpleMap';

interface InitArgs {
    marker_image_path: string
    marker_icon: string
    markers: Markers,
    editable: boolean
}

export default function SimpleMapApp(_runtime: any, element: any, json_args: InitArgs) {
    console.log(json_args);
    L.Icon.Default.prototype.options.imagePath = json_args.marker_image_path;
    ReactDom.render(<SimpleMap editable={json_args.editable} markers={json_args.markers}/>, element); 
}

declare global {
    interface Window { SimpleMapXBlock: (_runtime: any, element: any, json_args: InitArgs) => void }
}

// needed so that the xblock fragment api finds this xblock
window.SimpleMapXBlock = SimpleMapApp

