import { createEditor, Editor, Descendant, BaseEditor } from "slate";
import { ReactEditor } from "slate-react";
import { HistoryEditor } from "slate-history";

const objectFlip = (obj: any) => {
    const ret: any = {};
    Object.keys(obj).forEach((key) => {
        ret[obj[key]] = key.toLowerCase();
    });
    return ret;
};

//export type ParagraphElement = { type: "paragraph"; children: Descendant[] };
const TAG_TO_BLOCK = {
    P: "paragraph",
    UL: "bulleted-list",
    OL: "numbered-list",
    LI: "list-item",
    A: "link",
} as const;

export const LIST_TYPES = ["bulleted-list", "numbered-list"];

const BLOCK_TO_TAG = objectFlip(TAG_TO_BLOCK);

export type BlockTag = keyof typeof TAG_TO_BLOCK;
export type BlockType = typeof TAG_TO_BLOCK[BlockTag];
export const isBlockTag = (x: string): x is BlockTag => {
    return TAG_TO_BLOCK.hasOwnProperty(x);
};

const TAG_TO_MARK = {
    EM: "italic",
    STRONG: "bold",
    U: "underline",
} as const;

const MARK_TO_TAG = objectFlip(TAG_TO_MARK);

export type MarkTag = keyof typeof TAG_TO_MARK;
export type MarkType = typeof TAG_TO_MARK[MarkTag];
const isMarkTag = (x: string): x is MarkTag => {
    return TAG_TO_MARK.hasOwnProperty(x);
};

const OTHER_TO_TAGS = {
    BR: "\n",
} as const;
export type OtherTag = keyof typeof OTHER_TO_TAGS;
export type OtherType = typeof OTHER_TO_TAGS[OtherTag];
const isOtherTag = (x: string): x is OtherTag => {
    return OTHER_TO_TAGS.hasOwnProperty(x);
};

const isElementNode = (x: Node): x is Element => {
    return x.nodeType === 1;
};
const isTextNode = (x: Node): x is Text => {
    return x.nodeType === 3;
};

// enough checks for *our* purposes
const isElement = (x: CustomElement | CustomText): x is CustomElement => {
    return x.hasOwnProperty("type") && x.hasOwnProperty("children");
};
const isText = (x: CustomElement | CustomText): x is CustomText => {
    return x.hasOwnProperty("text");
};

type CustomElement = {
    type: BlockType;
    children: Descendant[];
    url?: string;
};

type TextFormat = {
    [K in MarkType]?: boolean;
};
type TextContent = {
    text: string;
};
type CustomText = TextFormat & TextContent;
type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
    interface CustomTypes {
        Editor: CustomEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

// TODO: tests
const deserialize = (el: Node): CustomElement | CustomText => {
    if (isTextNode(el)) {
        return { text: el.textContent || "" };
    } else if (isElementNode(el)) {
        if (isBlockTag(el.tagName)) {
            const children = Array.from(el.childNodes).map(deserialize);
            // Slate complains if it gets an empty node
            if (children.length === 0 && el.tagName === "P") {
                children.push({ text: "" });
            }
            let node: CustomElement = {
                type: TAG_TO_BLOCK[el.tagName],
                children: children,
            };
            let url = el.getAttribute("href");
            if (el.tagName == "A" && url !== null) {
                node.url = url;
            }
            return node;
        } else if (isMarkTag(el.tagName)) {
            const children = Array.from(el.childNodes).map(deserialize).flat();
            if (children.length === 1 && isText(children[0])) {
                let elem: CustomText = { ...children[0] };
                elem[TAG_TO_MARK[el.tagName]] = true;
                return elem;
            } else {
                throw new Error(
                    "Mark nodes should only have one child: a mark node or text node"
                );
            }
        } else if (isOtherTag(el.tagName)) {
            return { text: OTHER_TO_TAGS[el.tagName] };
        } else {
            throw new Error("Got unsupported html tag " + el.tagName);
        }
    } else {
        throw new Error("Can only deserialize text and element nodes!");
    }
};

export const html_to_editor_state = (html: string): Descendant[] => {
    const htmlDoc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(htmlDoc.body.childNodes).map(deserialize);
};

const serialize = (
    htmlDoc: HTMLDocument,
    element: CustomElement | CustomText
): Node => {
    if (isElement(element)) {
        let newElem = htmlDoc.createElement(BLOCK_TO_TAG[element.type]);
        const children = element.children.map((child) =>
            serialize(htmlDoc, child)
        );
        for (const child of children) {
            newElem.appendChild(child);
        }
        if (element.type === "link") {
            newElem.setAttribute("href", element.url);
        }
        return newElem;
    } else {
        if (isOtherTag(element.text)) {
            let newElem = htmlDoc.createElement(OTHER_TO_TAGS[element.text]);
            return newElem;
        } else {
            let newElem = htmlDoc.createTextNode(element.text);
            for (const format in MARK_TO_TAG) {
                if (
                    element.hasOwnProperty(format) &&
                    element[format as MarkType]
                ) {
                    let tmp = htmlDoc.createElement(MARK_TO_TAG[format]);
                    tmp.appendChild(newElem);
                    newElem = tmp;
                }
            }
            return newElem;
        }
    }
};

export const editor_state_to_html = (descs: Descendant[]): string => {
    var doc = document.implementation.createDocument("", "html", null);
    const children = descs.map((child) => serialize(doc, child));
    for (const child of children) {
        doc.documentElement.appendChild(child);
    }
    return doc.documentElement.innerHTML;
};

// TO TEST: * all error variants, nested marks, etc
