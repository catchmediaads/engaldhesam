"use client";

import { useRef, useState } from "react";

type ElementType =
  | "news"
  | "image"
  | "text"
  | "ad"
  | "divider"
  | "box";

type EditorElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
};

type ResizeState = {
  id: string;
  corner: "nw" | "ne" | "sw" | "se";
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

export default function NewEpaperPage() {
  const paperRef = useRef<HTMLDivElement | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [elements, setElements] =
    useState<EditorElement[]>([]);

  const [pages, setPages] = useState([1]);

  const [activePage, setActivePage] = useState(1);

  const [editionTitle, setEditionTitle] =
    useState("எங்கள் தேசம் - புதிய பதிப்பு");

  const [editionDate, setEditionDate] =
    useState("");

  const [dragState, setDragState] =
    useState<DragState | null>(null);

  const [resizeState, setResizeState] =
    useState<ResizeState | null>(null);

  const MIN_WIDTH = 40;
  const MIN_HEIGHT = 30;

  function addElement(type: ElementType) {
    const id = `${type}-${Date.now()}`;

    const defaults: Record<
      ElementType,
      {
        width: number;
        height: number;
        text: string;
      }
    > = {
      news: {
        width: 420,
        height: 180,
        text: "செய்தி தலைப்பு",
      },

      image: {
        width: 300,
        height: 220,
        text: "IMAGE",
      },

      text: {
        width: 300,
        height: 120,
        text: "உரை பகுதி",
      },

      ad: {
        width: 360,
        height: 160,
        text: "ADVERTISEMENT",
      },

      divider: {
        width: 400,
        height: 10,
        text: "",
      },

      box: {
        width: 300,
        height: 150,
        text: "",
      },
    };

    const item = defaults[type];

    const newElement: EditorElement = {
      id,
      type,
      x: 70,
      y: 110 + elements.length * 25,
      width: item.width,
      height: item.height,
      text: item.text,
    };

    setElements((previous) => [
      ...previous,
      newElement,
    ]);

    setSelectedId(id);
  }

  function updateElement(
    id: string,
    changes: Partial<EditorElement>
  ) {
    setElements((previous) =>
      previous.map((element) =>
        element.id === id
          ? { ...element, ...changes }
          : element
      )
    );
  }

  function deleteSelected() {
    if (!selectedId) return;

    setElements((previous) =>
      previous.filter(
        (element) => element.id !== selectedId
      )
    );

    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selectedId) return;

    const original = elements.find(
      (element) => element.id === selectedId
    );

    if (!original) return;

    const copy: EditorElement = {
      ...original,
      id: `${original.type}-${Date.now()}`,
      x: original.x + 20,
      y: original.y + 20,
    };

    setElements((previous) => [
      ...previous,
      copy,
    ]);

    setSelectedId(copy.id);
  }

  function addPage() {
    const nextPage =
      Math.max(...pages) + 1;

    setPages((previous) => [
      ...previous,
      nextPage,
    ]);

    setActivePage(nextPage);
  }

  /*
   * START MOVE
   */
  function startDrag(
    event: React.MouseEvent<HTMLDivElement>,
    element: EditorElement
  ) {
    if (resizeState) return;

    event.preventDefault();
    event.stopPropagation();

    const paper = paperRef.current;

    if (!paper) return;

    const paperRect =
      paper.getBoundingClientRect();

    const mouseX =
      event.clientX - paperRect.left;

    const mouseY =
      event.clientY - paperRect.top;

    setSelectedId(element.id);

    setDragState({
      id: element.id,
      offsetX: mouseX - element.x,
      offsetY: mouseY - element.y,
    });

    document.body.style.userSelect = "none";
  }

  /*
   * START RESIZE
   */
  function startResize(
    event: React.MouseEvent<HTMLDivElement>,
    element: EditorElement,
    corner: "nw" | "ne" | "sw" | "se"
  ) {
    event.preventDefault();
    event.stopPropagation();

    setSelectedId(element.id);

    setResizeState({
      id: element.id,
      corner,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startX: element.x,
      startY: element.y,
      startWidth: element.width,
      startHeight: element.height,
    });

    document.body.style.userSelect = "none";
  }

  /*
   * MOUSE MOVE
   */
  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const paper = paperRef.current;

    if (!paper) return;

    /*
     * RESIZING
     */
    if (resizeState) {
      const element = elements.find(
        (item) =>
          item.id === resizeState.id
      );

      if (!element) return;

      const dx =
        event.clientX -
        resizeState.startMouseX;

      const dy =
        event.clientY -
        resizeState.startMouseY;

      let newX = resizeState.startX;
      let newY = resizeState.startY;

      let newWidth =
        resizeState.startWidth;

      let newHeight =
        resizeState.startHeight;

      /*
       * Southeast
       */
      if (resizeState.corner === "se") {
        newWidth =
          resizeState.startWidth + dx;

        newHeight =
          resizeState.startHeight + dy;
      }

      /*
       * Southwest
       */
      if (resizeState.corner === "sw") {
        newWidth =
          resizeState.startWidth - dx;

        newHeight =
          resizeState.startHeight + dy;

        newX =
          resizeState.startX + dx;
      }

      /*
       * Northeast
       */
      if (resizeState.corner === "ne") {
        newWidth =
          resizeState.startWidth + dx;

        newHeight =
          resizeState.startHeight - dy;

        newY =
          resizeState.startY + dy;
      }

      /*
       * Northwest
       */
      if (resizeState.corner === "nw") {
        newWidth =
          resizeState.startWidth - dx;

        newHeight =
          resizeState.startHeight - dy;

        newX =
          resizeState.startX + dx;

        newY =
          resizeState.startY + dy;
      }

      /*
       * Minimum size
       */
      if (newWidth < MIN_WIDTH) {
        if (
          resizeState.corner === "nw" ||
          resizeState.corner === "sw"
        ) {
          newX =
            resizeState.startX +
            resizeState.startWidth -
            MIN_WIDTH;
        }

        newWidth = MIN_WIDTH;
      }

      if (newHeight < MIN_HEIGHT) {
        if (
          resizeState.corner === "nw" ||
          resizeState.corner === "ne"
        ) {
          newY =
            resizeState.startY +
            resizeState.startHeight -
            MIN_HEIGHT;
        }

        newHeight = MIN_HEIGHT;
      }

      /*
       * Keep inside page
       */

      if (newX < 0) {
        newX = 0;
      }

      if (newY < 0) {
        newY = 0;
      }

      if (
        newX + newWidth >
        paper.clientWidth
      ) {
        newWidth =
          paper.clientWidth - newX;
      }

      if (
        newY + newHeight >
        paper.clientHeight
      ) {
        newHeight =
          paper.clientHeight - newY;
      }

      if (newWidth < MIN_WIDTH) {
        newWidth = MIN_WIDTH;
      }

      if (newHeight < MIN_HEIGHT) {
        newHeight = MIN_HEIGHT;
      }

      updateElement(
        element.id,
        {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }
      );

      return;
    }

    /*
     * MOVING
     */
    if (dragState) {
      const element = elements.find(
        (item) =>
          item.id === dragState.id
      );

      if (!element) return;

      const paperRect =
        paper.getBoundingClientRect();

      let newX =
        event.clientX -
        paperRect.left -
        dragState.offsetX;

      let newY =
        event.clientY -
        paperRect.top -
        dragState.offsetY;

      const maxX =
        paper.clientWidth -
        element.width;

      const maxY =
        paper.clientHeight -
        element.height;

      newX = Math.max(
        0,
        Math.min(newX, maxX)
      );

      newY = Math.max(
        0,
        Math.min(newY, maxY)
      );

      updateElement(
        element.id,
        {
          x: newX,
          y: newY,
        }
      );
    }
  }

  /*
   * END MOVE / RESIZE
   */
  function stopInteraction() {
    if (!dragState && !resizeState) {
      return;
    }

    setDragState(null);
    setResizeState(null);

    document.body.style.userSelect = "";
  }

  const selectedElement =
    elements.find(
      (element) =>
        element.id === selectedId
    );

  return (
    <main className="designer">

      {/* TOP BAR */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-title">
            எங்கள் தேசம்
          </div>

          <div className="brand-subtitle">
            E-PAPER DESIGNER
          </div>

        </div>

        <div className="edition-info">

          <input
            value={editionTitle}
            onChange={(event) =>
              setEditionTitle(
                event.target.value
              )
            }
            className="edition-title"
          />

          <input
            type="date"
            value={editionDate}
            onChange={(event) =>
              setEditionDate(
                event.target.value
              )
            }
            className="edition-date"
          />

        </div>

        <div className="top-actions">

          <button>
            💾 Save Draft
          </button>

          <button>
            👁 Preview
          </button>

          <button className="publish-button">
            Publish
          </button>

        </div>

      </header>


      {/* WORKSPACE */}

      <div
        className="workspace"
        onMouseMove={handleMouseMove}
        onMouseUp={stopInteraction}
        onMouseLeave={stopInteraction}
      >

        {/* LEFT PANEL */}

        <aside className="left-panel">

          <div className="panel-title">
            ELEMENTS
          </div>

          <button
            className="tool"
            onClick={() =>
              addElement("news")
            }
          >
            <span>📰</span>
            <strong>News</strong>
            <small>Article block</small>
          </button>

          <button
            className="tool"
            onClick={() =>
              addElement("image")
            }
          >
            <span>🖼️</span>
            <strong>Image</strong>
            <small>Photo / picture</small>
          </button>

          <button
            className="tool"
            onClick={() =>
              addElement("text")
            }
          >
            <span>✏️</span>
            <strong>Text</strong>
            <small>Text block</small>
          </button>

          <button
            className="tool"
            onClick={() =>
              addElement("ad")
            }
          >
            <span>📢</span>
            <strong>Advertisement</strong>
            <small>Ad block</small>
          </button>

          <button
            className="tool"
            onClick={() =>
              addElement("divider")
            }
          >
            <span>➖</span>
            <strong>Divider</strong>
            <small>Horizontal line</small>
          </button>

          <button
            className="tool"
            onClick={() =>
              addElement("box")
            }
          >
            <span>▭</span>
            <strong>Box</strong>
            <small>Layout container</small>
          </button>

        </aside>


        {/* CANVAS */}

        <section className="canvas-area">

          <div className="canvas-toolbar">

            <span>
              Page {activePage}
            </span>

            <span>
              100%
            </span>

          </div>

          <div className="canvas-scroll">

            <div
              ref={paperRef}
              className="paper"
              onClick={() =>
                setSelectedId(null)
              }
            >

              {/* PAPER HEADER */}

              <div className="paper-header">

                <div className="paper-logo">
                  எங்கள் தேசம்
                </div>

                <div className="paper-date">
                  {editionDate ||
                    "20 செப்டம்பர் 2026"}
                </div>

              </div>


              {/* ELEMENTS */}

              {elements.map(
                (element) => (

                  <div
                    key={element.id}
                    className={`editor-element ${
                      selectedId ===
                      element.id
                        ? "selected"
                        : ""
                    } element-${
                      element.type
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width:
                        element.width,
                      height:
                        element.height,
                    }}
                    onMouseDown={(
                      event
                    ) =>
                      startDrag(
                        event,
                        element
                      )
                    }
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      setSelectedId(
                        element.id
                      );
                    }}
                  >

                    {element.type ===
                      "news" && (
                      <>
                        <div className="news-category">
                          தமிழ்நாடு
                        </div>

                        <div className="news-headline">
                          {
                            element.text
                          }
                        </div>

                        <div className="news-body">
                          செய்தியின்
                          முன்னோட்ட உரை
                          இங்கே
                          தோன்றும்.
                          பின்னர் CMS-ல்
                          உள்ள செய்தியை
                          நேரடியாக
                          இங்கே இழுத்து
                          விடலாம்.
                        </div>
                      </>
                    )}

                    {element.type === "image" && (
  <div className="image-placeholder">
    <div className="image-icon">
      🖼️
    </div>

    <span>
      Image
    </span>
  </div>
)}

                    {element.type ===
                      "text" && (
                      <div className="text-placeholder">
                        {
                          element.text
                        }
                      </div>
                    )}

                    {element.type ===
                      "ad" && (
                      <div className="ad-placeholder">
                        <strong>
                          ADVERTISEMENT
                        </strong>

                        <span>
                          Advertisement Area
                        </span>
                      </div>
                    )}

                    {element.type ===
                      "divider" && (
                      <div className="divider-element" />
                    )}

                    {element.type ===
                      "box" && (
                      <div className="box-element" />
                    )}


                    {/* RESIZE HANDLES */}

                    {selectedId ===
                      element.id && (
                      <>
                        <div
                          className="resize-handle nw"
                          onMouseDown={(
                            event
                          ) =>
                            startResize(
                              event,
                              element,
                              "nw"
                            )
                          }
                        />

                        <div
                          className="resize-handle ne"
                          onMouseDown={(
                            event
                          ) =>
                            startResize(
                              event,
                              element,
                              "ne"
                            )
                          }
                        />

                        <div
                          className="resize-handle sw"
                          onMouseDown={(
                            event
                          ) =>
                            startResize(
                              event,
                              element,
                              "sw"
                            )
                          }
                        />

                        <div
                          className="resize-handle se"
                          onMouseDown={(
                            event
                          ) =>
                            startResize(
                              event,
                              element,
                              "se"
                            )
                          }
                        />
                      </>
                    )}

                  </div>

                )
              )}

            </div>

          </div>

        </section>


        {/* RIGHT PANEL */}

        <aside className="right-panel">

          <div className="panel-title">
            PROPERTIES
          </div>

          {!selectedElement && (
            <div className="no-selection">

              <div>
                🖱️
              </div>

              <p>
                Select an element on the
                page to edit its
                properties.
              </p>

            </div>
          )}

          {selectedElement && (
            <div className="properties">

              <div className="property-type">
                {selectedElement.type.toUpperCase()}
              </div>

              <label>
                Text
              </label>

              <input
                value={
                  selectedElement.text
                }
                onChange={(event) =>
                  updateElement(
                    selectedElement.id,
                    {
                      text:
                        event.target
                          .value,
                    }
                  )
                }
              />

              <div className="property-grid">

                <div>
                  <label>
                    X
                  </label>

                  <input
                    type="number"
                    value={Math.round(
                      selectedElement.x
                    )}
                    onChange={(
                      event
                    ) =>
                      updateElement(
                        selectedElement.id,
                        {
                          x: Number(
                            event
                              .target
                              .value
                          ),
                        }
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Y
                  </label>

                  <input
                    type="number"
                    value={Math.round(
                      selectedElement.y
                    )}
                    onChange={(
                      event
                    ) =>
                      updateElement(
                        selectedElement.id,
                        {
                          y: Number(
                            event
                              .target
                              .value
                          ),
                        }
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Width
                  </label>

                  <input
                    type="number"
                    value={Math.round(
                      selectedElement.width
                    )}
                    onChange={(
                      event
                    ) =>
                      updateElement(
                        selectedElement.id,
                        {
                          width:
                            Number(
                              event
                                .target
                                .value
                            ),
                        }
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Height
                  </label>

                  <input
                    type="number"
                    value={Math.round(
                      selectedElement.height
                    )}
                    onChange={(
                      event
                    ) =>
                      updateElement(
                        selectedElement.id,
                        {
                          height:
                            Number(
                              event
                                .target
                                .value
                            ),
                        }
                      )
                    }
                  />
                </div>

              </div>

              <button
                className="duplicate"
                onClick={
                  duplicateSelected
                }
              >
                📋 Duplicate
              </button>

              <button
                className="delete"
                onClick={
                  deleteSelected
                }
              >
                🗑 Delete Element
              </button>

            </div>
          )}

        </aside>

      </div>


      {/* PAGE STRIP */}

      <footer className="page-strip">

        <div className="page-thumbnails">

          {pages.map((page) => (

            <button
              key={page}
              className={`page-thumbnail ${
                activePage === page
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(page)
              }
            >

              <div className="mini-page">
                {page}
              </div>

              <span>
                Page {page}
              </span>

            </button>

          ))}

          <button
            className="add-page"
            onClick={addPage}
          >

            <strong>
              ＋
            </strong>

            <span>
              Add Page
            </span>

          </button>

        </div>

      </footer>


      <style jsx>{styles}</style>

    </main>
  );
}


const styles = `

  * {
    box-sizing: border-box;
  }

  .designer {
    min-height: 100vh;
    background: #e7e9eb;
    color: #18212b;
    display: flex;
    flex-direction: column;
  }


  /* TOP BAR */

  .topbar {
    height: 72px;
    background: #18212b;
    color: white;
    display: flex;
    align-items: center;
    padding: 0 18px;
    gap: 25px;
    flex-shrink: 0;
  }

  .brand {
    min-width: 210px;
  }

  .brand-title {
    font-size: 20px;
    font-weight: 800;
  }

  .brand-subtitle {
    font-size: 9px;
    letter-spacing: 2px;
    opacity: .65;
    margin-top: 3px;
  }

  .edition-info {
    display: flex;
    gap: 8px;
    flex: 1;
    align-items: center;
  }

  .edition-title,
  .edition-date {
    background: #27333e;
    border: 1px solid #3b4751;
    color: white;
    border-radius: 5px;
    padding: 8px 10px;
  }

  .edition-title {
    width: 330px;
  }

  .edition-date {
    width: 155px;
  }

  .top-actions {
    display: flex;
    gap: 8px;
  }

  .top-actions button {
    border: 1px solid #45515c;
    background: #27333e;
    color: white;
    padding: 9px 13px;
    border-radius: 5px;
    font-weight: 700;
    cursor: pointer;
  }

  .top-actions .publish-button {
    background: #176b73;
    border-color: #176b73;
  }


  /* WORKSPACE */

  .workspace {
    flex: 1;
    display: grid;
    grid-template-columns: 210px minmax(500px, 1fr) 240px;
    min-height: 0;
  }


  /* PANELS */

  .left-panel,
  .right-panel {
    background: #f8f9fa;
    border-right: 1px solid #d5d9dc;
    overflow-y: auto;
  }

  .right-panel {
    border-right: none;
    border-left: 1px solid #d5d9dc;
  }

  .panel-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #69737b;
    padding: 18px 15px 10px;
  }


  /* TOOLS */

  .tool {
    width: calc(100% - 20px);
    margin: 4px 10px;
    padding: 12px;
    display: grid;
    grid-template-columns: 32px 1fr;
    grid-template-rows: auto auto;
    column-gap: 8px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 7px;
    text-align: left;
    cursor: pointer;
  }

  .tool:hover {
    background: #eef3f2;
    border-color: #d7e3e3;
  }

  .tool span {
    grid-row: 1 / span 2;
    font-size: 22px;
    display: flex;
    align-items: center;
  }

  .tool strong {
    font-size: 13px;
    color: #253039;
  }

  .tool small {
    font-size: 10px;
    color: #7b858d;
    margin-top: 3px;
  }


  /* CANVAS */

  .canvas-area {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #dfe2e4;
  }

  .canvas-toolbar {
    height: 43px;
    background: #f6f7f8;
    border-bottom: 1px solid #d2d6d9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 15px;
    color: #657078;
    font-size: 12px;
    font-weight: 700;
  }

  .canvas-scroll {
    flex: 1;
    overflow: auto;
    padding: 40px;
  }

  .paper {
    width: 794px;
    min-height: 1123px;
    background: white;
    margin: 0 auto;
    position: relative;
    box-shadow: 0 4px 20px rgba(0,0,0,.18);
    overflow: hidden;
    user-select: none;
  }

  .paper-header {
    position: absolute;
    left: 35px;
    right: 35px;
    top: 25px;
    height: 55px;
    border-bottom: 2px solid #18212b;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
  }

  .paper-logo {
    font-size: 28px;
    font-weight: 900;
  }

  .paper-date {
    font-size: 11px;
    color: #657078;
  }


  /* ELEMENTS */

  .editor-element {
    position: absolute;
    border: 1px solid transparent;
    cursor: grab;
    overflow: visible;
    touch-action: none;
  }

  .editor-element:active {
    cursor: grabbing;
  }

  .editor-element.selected {
    border: 2px solid #176b73;
    box-shadow: 0 0 0 2px rgba(23,107,115,.12);
  }


  /* RESIZE HANDLES */

  .resize-handle {
    position: absolute;
    width: 11px;
    height: 11px;
    background: white;
    border: 2px solid #176b73;
    border-radius: 50%;
    z-index: 20;
  }

  .resize-handle.nw {
    left: -7px;
    top: -7px;
    cursor: nwse-resize;
  }

  .resize-handle.ne {
    right: -7px;
    top: -7px;
    cursor: nesw-resize;
  }

  .resize-handle.sw {
    left: -7px;
    bottom: -7px;
    cursor: nesw-resize;
  }

  .resize-handle.se {
    right: -7px;
    bottom: -7px;
    cursor: nwse-resize;
  }


  /* NEWS */

  .element-news {
    padding: 12px;
    border-bottom: 1px solid #18212b;
    background: white;
  }

  .news-category {
    color: #176b73;
    font-size: 10px;
    font-weight: 800;
    margin-bottom: 7px;
  }

  .news-headline {
    font-size: 24px;
    line-height: 1.12;
    font-weight: 900;
    margin-bottom: 9px;
  }

  .news-body {
    font-size: 12px;
    line-height: 1.5;
    color: #505b63;
  }


  /* IMAGE */

  .image-placeholder {
    height: 100%;
    background: #e9edef;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #76818a;
    font-size: 35px;
  }

  .image-placeholder span {
    font-size: 11px;
    margin-top: 5px;
  }


  /* TEXT */

  .text-placeholder {
    padding: 12px;
    font-size: 18px;
    line-height: 1.5;
  }


  /* AD */

  .ad-placeholder {
    height: 100%;
    background: #f3f3f1;
    border: 1px dashed #9ca5ab;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6b747b;
  }

  .ad-placeholder strong {
    font-size: 13px;
  }

  .ad-placeholder span {
    font-size: 10px;
    margin-top: 5px;
  }


  /* DIVIDER */

  .divider-element {
    height: 2px;
    background: #18212b;
    position: absolute;
    top: 4px;
    left: 0;
    right: 0;
  }


  /* BOX */

  .box-element {
    height: 100%;
    border: 2px solid #18212b;
  }


  /* PROPERTIES */

  .no-selection {
    padding: 45px 20px;
    text-align: center;
    color: #879097;
  }

  .no-selection div {
    font-size: 35px;
    margin-bottom: 10px;
  }

  .no-selection p {
    font-size: 12px;
    line-height: 1.5;
  }

  .properties {
    padding: 15px;
  }

  .property-type {
    background: #eef3f2;
    color: #176b73;
    border-radius: 5px;
    padding: 8px;
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 15px;
  }

  .properties label {
    display: block;
    font-size: 11px;
    color: #606b73;
    font-weight: 700;
    margin: 12px 0 5px;
  }

  .properties input {
    width: 100%;
    border: 1px solid #cfd4d7;
    border-radius: 5px;
    padding: 8px;
    font-size: 12px;
  }

  .property-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .duplicate,
  .delete {
    width: 100%;
    margin-top: 18px;
    padding: 9px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 700;
  }

  .duplicate {
    border: 1px solid #cbd2d5;
    background: white;
    color: #3e4a53;
  }

  .delete {
    border: 1px solid #e2bcbc;
    background: #fff4f4;
    color: #a13232;
  }


  /* PAGE STRIP */

  .page-strip {
    height: 105px;
    background: #f6f7f8;
    border-top: 1px solid #cdd2d5;
    overflow-x: auto;
    flex-shrink: 0;
  }

  .page-thumbnails {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 18px;
  }

  .page-thumbnail {
    width: 68px;
    height: 82px;
    border: 1px solid #ccd2d5;
    background: white;
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
  }

  .page-thumbnail.active {
    border: 2px solid #176b73;
  }

  .mini-page {
    height: 58px;
    border: 1px solid #d8dcde;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
  }

  .page-thumbnail span,
  .add-page span {
    font-size: 9px;
    color: #68737b;
  }

  .add-page {
    width: 68px;
    height: 82px;
    border: 1px dashed #aeb6bb;
    background: white;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  .add-page strong {
    font-size: 24px;
    color: #176b73;
  }


  @media (max-width: 1000px) {

    .workspace {
      grid-template-columns:
        180px
        minmax(450px, 1fr)
        200px;
    }

    .edition-info {
      display: none;
    }

  }

`;