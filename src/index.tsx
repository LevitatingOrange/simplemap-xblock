import React from "react";
import ReactDom from "react-dom";
import "./index.css";
import SimpleMap from "./SimpleMap";

interface InitArgs {
    foo: string
}

export default function SimpleMapApp(_runtime: any, element: any, json_args: InitArgs) {
    console.log(json_args);
    ReactDom.render(<SimpleMap />, element); 
}

// needed so that the xblock fragment api finds this xblock
declare global {
    interface Window { SimpleMapXBlock: (_runtime: any, element: any, json_args: InitArgs) => void }
}

window.SimpleMapXBlock = SimpleMapApp

