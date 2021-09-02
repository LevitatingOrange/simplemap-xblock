import React from "react";
import Axios from "axios";

export const ENDPOINTS = [
    "add_marker",
    "change_marker",
    "delete_marker",
    "set_center",
] as const;
export type Endpoint = typeof ENDPOINTS[number];

//export type Endpoints = "change_marker";
export type EndpointUrls = {
    [key in Endpoint]: string;
};

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(";").shift();
}

export default class APIHandler {
    urls?: EndpointUrls;

    constructor(urls?: EndpointUrls) {
        this.urls = urls;
        Axios.defaults.headers.post["X-CSRFToken"] = getCookie("csrftoken");
    }

    // TODO: return type
    async post(endpoint: Endpoint, data: any) {
        if (this.urls === undefined) {
            console.error("API Handler post called without installed urls");
            return;
        }
        console.info(
            `Sending post request to ${endpoint} with url ${this.urls[endpoint]} and data `,
            data
        );
        //const formData = new FormData();
        //Object.entries(data).map(([key, val]) => {
        //    formData.append(key, string(val));
        //});
        // we can't simply send json because edx wants formdata instead *shrug*
        return Axios.post(this.urls[endpoint], JSON.stringify(data));
    }
}

export const APIContext = React.createContext(new APIHandler());
