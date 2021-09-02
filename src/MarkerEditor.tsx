import React, { useMemo, useState, useCallback } from "react";
import {
    createEditor,
    Element as SlateElement,
    BaseEditor,
    Descendant,
    Transforms,
    Editor,
} from "slate";
import { useSlate, Slate, Editable, withReact, ReactEditor } from "slate-react";
import { HistoryEditor, withHistory } from "slate-history";
import { isHotkey } from "is-hotkey";

const HOTKEYS = {
    "mod+b": "bold",
    "mod+i": "italic",
    "mod+u": "underline",
    "mod+`": "code",
};

export type CustomText = {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    underline?: boolean;
    text: string;
};
type ParagraphElement = { type: "paragraph"; children: Descendant[] };
type ListItemElement = { type: "list-item"; children: Descendant[] };
type HeadingOneElement = { type: "heading-one"; children: Descendant[] };
type BulletedListElement = {
    type: "bulleted-list";
    children: Descendant[];
};
type NumbererdListElement = {
    type: "numbered-list";
    children: Descendant[];
};
type HeadingTwoElement = { type: "heading-two"; children: Descendant[] };
//type CheckListItemElement = {
//  type: 'check-list-item'
//  checked: boolean
//  children: Descendant[]
//}
type BlockQuoteElement = { type: "block-quote"; children: Descendant[] };
type CustomElement =
    | ParagraphElement
    | ListItemElement
    | BulletedListElement
    | NumbererdListElement
    | BlockQuoteElement
    | HeadingOneElement
    | HeadingTwoElement;

type ElementType = CustomElement["type"];
type TextFormat = keyof Omit<CustomText, "text">;

declare module "slate" {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor & HistoryEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

const LIST_TYPES = ["numbered-list", "bulleted-list"];

export default () => {
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);
    const [value, setValue] = useState<Descendant[]>([
        { type: "paragraph", children: [{ text: "" }] },
    ]);
    const renderElement = useCallback((props) => <Element {...props} />, []);
    const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
    return (
        <Slate
            editor={editor}
            value={value}
            onChange={(newValue) => setValue(newValue)}
        >
            <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                spellCheck
                autoFocus
                placeholder="Enter text…"
                onKeyDown={(event) => {
                    for (const hotkey in HOTKEYS) {
                        if (isHotkey(hotkey, event as any)) {
                            event.preventDefault();
                            //TOOD: why is this so difficult for Typescript?
                            const mark = HOTKEYS[
                                hotkey as keyof typeof HOTKEYS
                            ] as TextFormat;
                            toggleMark(editor, mark);
                        }
                    }
                }}
            />
        </Slate>
    );
};

const toggleBlock = (editor: Editor, format: ElementType) => {
    const isActive = isBlockActive(editor, format);
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type),
        split: true,
    });
    const newProperties: Partial<SlateElement> = {
        type: isActive ? "paragraph" : isList ? "list-item" : format,
    };
    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
    }
};

const toggleMark = (editor: Editor, format: TextFormat) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const isBlockActive = (editor: Editor, format: ElementType) => {
    const [match] = Editor.nodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === format,
    });

    return !!match;
};

const isMarkActive = (editor: Editor, format: TextFormat) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

const Element = (props: {
    attributes: any;
    element: CustomElement;
    children: any;
}) => {
    switch (props.element.type) {
        case "block-quote":
            return (
                <blockquote {...props.attributes}>{props.children}</blockquote>
            );
        case "bulleted-list":
            return <ul {...props.attributes}>{props.children}</ul>;
        case "heading-one":
            return <h1 {...props.attributes}>{props.children}</h1>;
        case "heading-two":
            return <h2 {...props.attributes}>{props.children}</h2>;
        case "list-item":
            return <li {...props.attributes}>{props.children}</li>;
        case "numbered-list":
            return <ol {...props.attributes}>{props.children}</ol>;
        case "paragraph":
            return <p {...props.attributes}>{props.children}</p>;
        default:
            console.warn(
                `Rendering unknown element ${props.element}, defaulting to <p></p>`
            );
            return <p {...props.attributes}>{props.children}</p>;
    }
};

const Leaf = (props: { attributes: any; leaf: CustomText; children: any }) => {
    if (props.leaf.bold) {
        props.children = <strong>{props.children}</strong>;
    }

    if (props.leaf.code) {
        props.children = <code>{props.children}</code>;
    }

    if (props.leaf.italic) {
        props.children = <em>{props.children}</em>;
    }

    if (props.leaf.underline) {
        props.children = <u>{props.children}</u>;
    }
    return <span {...props.attributes}>{props.children}</span>;
};

const EditorButton = (props: { active: boolean; icon; tooltip: string }) => {
    let className = "editor-button";
    if (props.active) {
        className += " active";
    }
    return <span className={className}></span>;
};
