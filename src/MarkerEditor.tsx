import React, {
    useState,
    useMemo,
    useRef,
    useContext,
    useCallback,
    useEffect,
} from "react";
import { APIContext } from "./handlers";
import { debounce } from "lodash";
import {
    FaTrashAlt,
    FaBold,
    FaItalic,
    FaUnderline,
    FaListOl,
    FaListUl,
    FaLink,
    FaUnlink,
} from "react-icons/fa";
import { Editable, withReact, useSlate, Slate } from "slate-react";
import {
    LIST_TYPES,
    BlockType,
    MarkType,
    html_to_editor_state,
    editor_state_to_html,
} from "./EditorUtil";
import {
    Range,
    Transforms,
    createEditor,
    Descendant,
    Element as SlateElement,
    Text as SlateText,
    Editor,
} from "slate";
import isUrl from "is-url";
import { withHistory } from "slate-history";
import DOMPurify from "dompurify";

const DEBOUNCE_TIME_MS = 3000;

const withLinks = (editor: Editor) => {
    const { insertData, insertText, isInline } = editor;

    editor.isInline = (element) => {
        return element.type === "link" ? true : isInline(element);
    };

    editor.insertText = (text) => {
        if (text && isUrl(text)) {
            wrapLink(editor, text);
        } else {
            insertText(text);
        }
    };

    editor.insertData = (data) => {
        const text = data.getData("text/plain");

        if (text && isUrl(text)) {
            wrapLink(editor, text);
        } else {
            insertData(data);
        }
    };

    return editor;
};

const insertLink = (editor: Editor, url: string) => {
    if (editor.selection) {
        wrapLink(editor, url);
    }
};

const isLinkActive = (editor: Editor) => {
    const [link] = Editor.nodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === "link",
    });
    return !!link;
};

const getCurLink = (editor: Editor): string => {
    let [link] = Editor.nodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === "link",
    });


    if (link !== undefined && link !== null) {
        return (link[0] as unknown as SlateElement).url || "";
    } else {
        return "";
    }
};

const unwrapLink = (editor: Editor) => {
    Transforms.unwrapNodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === "link",
    });
};

const wrapLink = (editor: Editor, url: string) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor);
    }

    const { selection } = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link: SlateElement = {
        type: "link",
        url,
        children: isCollapsed ? [{ text: url }] : [],
    };

    if (isCollapsed) {
        Transforms.insertNodes(editor, link);
    } else {
        Transforms.wrapNodes(editor, link, { split: true });
        Transforms.collapse(editor, { edge: "end" });
    }
};

const MarkButton = (props: { format: MarkType; children: any }) => {
    const editor = useSlate();
    // aria-label="Bold"
    return (
        <a
            role="button"
            href="#"
            className={
                isMarkActive(editor, props.format) ? "button-active" : ""
            }
            onClick={(event) => {
                event.preventDefault();
                toggleMark(editor, props.format);
            }}
        >
            {props.children}
        </a>
    );
};

const BlockButton = (props: { format: BlockType; children: any }) => {
    const editor = useSlate();
    return (
        <a
            role="button"
            href="#"
            className={
                isBlockActive(editor, props.format) ? "button-active" : ""
            }
            onClick={(event) => {
                event.preventDefault();
                toggleBlock(editor, props.format);
            }}
        >
            {props.children}
        </a>
    );
};

const LinkButton = () => {
    const editor = useSlate();
    return (
        <a
            role="button"
            href="#"
            onClick={(event) => {
                event.preventDefault();
                const url = window.prompt(
                    "Enter the URL of the link:",
                    getCurLink(editor)
                );
                if (!url || url == "") return;
                insertLink(editor, url);
            }}
        >
            <FaLink />
        </a>
    );
};

const RemoveLinkButton = () => {
    const editor = useSlate();

    return (
        <a
            className={isLinkActive(editor) ? "button-active" : ""}
            onClick={(event) => {
                event.preventDefault();
                if (isLinkActive(editor)) {
                    unwrapLink(editor);
                }
            }}
        >
            <FaUnlink />
        </a>
    );
};

const getIntialState = (content: string) => {
    let initialState = html_to_editor_state(content);
    if (initialState.length === 0) {
        initialState = [{ type: "paragraph", children: [{ text: "" }] }];
    }
    return initialState;
};

export default (props: {
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
            }, DEBOUNCE_TIME_MS),
        [props.marker_id]
    );

    //"<p><strong>Hello</strong> World. We like it <em><strong>here</strong></em></p>"
    const [value, setValue] = useState<Descendant[]>(
        getIntialState(props.content)
    );
    const debouncedValueHandler = useMemo(
        () =>
            debounce(async (value: Descendant[]) => {
                const new_content = DOMPurify.sanitize(
                    editor_state_to_html(value),
                    { USE_PROFILES: { html: true } }
                );
                console.info("Sending new marker data to server...");
                try {
                    const response = await apiHandler.post("change_marker", {
                        marker_id: props.marker_id,
                        content: new_content,
                    });
                    console.info(
                        "Marker data has been accepted, response was: ",
                        response
                    );
                } catch (error) {
                    console.error("Could not push new marker data:", error);
                }
            }, DEBOUNCE_TIME_MS),
        []
    );

    // Cleanup
    useEffect(() => {
        return () => {
            debouncedTitleHandler.flush();
            debouncedValueHandler.flush();
        };
    }, []);
    const renderElement = useCallback((props) => <Element {...props} />, []);
    const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
    const editor = useMemo(
        () => withLinks(withHistory(withReact(createEditor()))),
        []
    );

    // because we are paranoid
    const safe_content = useMemo(
        () =>
            DOMPurify.sanitize(editor_state_to_html(value), {
                USE_PROFILES: { html: true },
            }),
        [value]
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

                <Slate
                    editor={editor}
                    value={value}
                    onChange={(value) => {
                        setValue(value);
                        debouncedValueHandler(value);
                    }}
                >
                    <section className="toolbar">
                        <BlockButton format="numbered-list">
                            <FaListOl />
                        </BlockButton>
                        <BlockButton format="bulleted-list">
                            <FaListUl />
                        </BlockButton>

                        <MarkButton format="bold">
                            <FaBold />
                        </MarkButton>
                        <MarkButton format="italic">
                            <FaItalic />
                        </MarkButton>
                        <MarkButton format="underline">
                            <FaUnderline />
                        </MarkButton>

                        <LinkButton />
                        <RemoveLinkButton />

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
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        placeholder="Enter some rich text…"
                        spellCheck
                        autoFocus
                        className="marker-editor-editable"
                    />
                </Slate>
            </div>
        );
    } else {
        return (
            <div className="popup">
                <h3>{title}</h3>
                <section
                    className="content"
                    dangerouslySetInnerHTML={{ __html: safe_content }}
                ></section>
            </div>
        );
    }
};

const Element = (props: { attributes: any; children: any; element: any }) => {
    switch (props.element.type) {
        case "bulleted-list":
            return <ul {...props.attributes}>{props.children}</ul>;
        case "numbered-list":
            return <ol {...props.attributes}>{props.children}</ol>;
        case "list-item":
            return <li {...props.attributes}>{props.children}</li>;
        case "link":
            return (
                <a {...props.attributes} href={props.element.url}>
                    {props.children}
                </a>
            );

        default:
            if (props.element.type !== "paragraph") {
                console.warn("Unknown element type", props.element.type);
            }
            return <p {...props.attributes}>{props.children}</p>;
    }
};

const Leaf = (props: { attributes: any; children: any; leaf: any }) => {
    let rendered_children = props.children;
    if (props.leaf.bold) {
        rendered_children = <strong>{rendered_children}</strong>;
    }

    if (props.leaf.italic) {
        rendered_children = <em>{rendered_children}</em>;
    }
    if (props.leaf.underline) {
        rendered_children = <u>{rendered_children}</u>;
    }

    return <span {...props.attributes}>{rendered_children}</span>;
};

const toggleMark = (editor: Editor, format: MarkType) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const toggleBlock = (editor: Editor, format: BlockType) => {
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

const isMarkActive = (editor: Editor, format: MarkType) => {
    const marks = Editor.marks(editor) as any;
    return marks ? (marks[format] as any) === true : false;
};

const isBlockActive = (editor: Editor, format: BlockType) => {
    const [match] = Editor.nodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === format,
    });

    return !!match;
};
