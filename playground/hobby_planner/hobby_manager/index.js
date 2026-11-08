import { LONG_MONTHS, HobbyManager, ActivityHeatmapManager } from "../dataFacther.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const ICONS = {
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5H2"/><path d="M6 12h12"/><path d="M9 19h6"/><path d="M16 5h6"/><path d="M19 8V2"/></svg>`,
    create: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`
};

/**
 * Creates an HTML element with an optional class name and text.
 *
 * @param {string} tag
 * @param {string} [className=""]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, className = "", text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/**
 * Creates an SVG element with the given attributes.
 *
 * @param {string} tag
 * @param {Object<string, string|number>} [attrs={}]
 * @returns {SVGElement}
 */
function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
        node.setAttribute(key, value);
    }
    return node;
}

/**
 * Generates a dummy hobby collection for testing and development.
 *
 * Creates three top-level hobbies, each initialized with the default
 * hobby properties. Adds two child hobbies under the top-level hobby
 * with ID "1".
 *
 * Each hobby receives an independent copy of the default data structure,
 * including its own children object.
 *
 * The returned collection uses hobby IDs as object keys, with child
 * hobbies stored inside their parent's `children` property.
 *
 * @returns {Object<string, Object>} A nested collection of fake hobby records.
 *
 * @example
 * const hobbies = getFakeHobbiesData();
 *
 * // Access a top-level hobby
 * hobbies["1"];
 *
 * // Access its children
 * hobbies["1"].children["2"];
 */
function getFakeHobbiesData() {
    const dummy = {
        name: '',
        createdAt: '2026-01-01T09:00:00',
        updatedAt: '2026-10-20T12:00:00',
        parentId: null,
        description: '',
        unit_name: '',
        unit_type: 'boolean',
        target: null,
        color: null,
        children: {}
    };

    const names = ["Reading", "Coding", "Sketching"];
    const children = ["Frontend", "Algorithms"];
    const fake_data = {};

    names.forEach((name, i) => {
        fake_data[i] = { ...structuredClone(dummy), name };
    });

    children.forEach((name, i) => {
        fake_data["1"].children[names.length + i] = {
            ...structuredClone(dummy), name, parentId: "1"
        };
    });

    return fake_data;
}

/**
 * Generates dummy graph data for a hobby.
 *
 * Returns a predefined color and an array of sample values
 * to be used for graph visualization during development
 * or when displaying placeholder data.
 *
 * @returns {{ color: string, values: number[] }}
 */
function getFakeGraphData() {
    return {
        color: '#6366F1',
        values: [
            0.50, 0.67, 0.47,
            0.20, 0.87, 0.38,
            0.67, 0.27, 0.57,
            0.20
        ]
    }
}

/**
 * Creates an SVG sparkline representing a series of normalized values.
 *
 * Each value is expected to be between 0 and 1, where 0 represents
 * the bottom of the graph and 1 represents the top.
 *
 * Values outside this range are clamped automatically.
 *
 * @param {Object} [data={}]
 *        Graph configuration.
 *
 * @param {number[]} [data.values=[]]
 *        Values used to generate the graph.
 *
 * @param {string} [data.color="#2da44e"]
 *        Stroke color of the graph line.
 *
 * @param {number} [width=120]
 *        SVG viewport width.
 *
 * @param {number} [height=40]
 *        SVG viewport height.
 *
 * @returns {SVGSVGElement}
 *          Generated SVG element.
 */


/**
 * Generates SVG sparkline graphs with a smooth line,
 * gradient area fill, and endpoint indicator.
 *
 * Each value is expected to be between 0 and 1 (0 = bottom, 1 = top).
 * Values outside this range are clamped.
 */
class SvgGraph {

    static #graphCounter = 0;

    /**
     * Generates an SVG sparkline element.
     *
     * @param {Object} [data={}] Graph configuration.
     * @param {number[]} [data.values=[]] Values used to generate the graph.
     * @param {string} [data.color="#2da44e"] Graph line and fill color.
     * @param {number} [width=80] SVG width in pixels.
     * @param {number} [height=28] SVG height in pixels.
     * @returns {SVGSVGElement} Generated SVG element.
     */
    create({ values = [], color = "#2da44e" } = {}, width = 80, height = 28) {

        const svg = svgEl("svg", {
            viewBox: `0 0 ${width} ${height}`,
            width,
            height,
            class: "sparkline",
            "aria-hidden": "true"
        });

        if (!Array.isArray(values) || values.length === 0) return svg;

        const pad = 3;
        const innerW = width - pad * 2;
        const innerH = height - pad * 2;

        const pts = values.map((value, i) => {
            const n = Number(value);
            const v = Number.isFinite(n)
                ? Math.max(0, Math.min(1, n))
                : 0;

            return {
                x: pad + (
                    values.length === 1
                        ? innerW / 2
                        : (i / (values.length - 1)) * innerW
                ),
                y: pad + (1 - v) * innerH
            };
        });

        const mid = (a, b) => ({
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2
        });

        const first = pts[0];
        const last = pts[pts.length - 1];

        let d = `M${first.x},${first.y}`;

        for (let i = 1; i < pts.length - 1; i++) {
            const m = mid(pts[i], pts[i + 1]);
            d += ` Q${pts[i].x},${pts[i].y} ${m.x},${m.y}`;
        }

        d += ` L${last.x},${last.y}`;

        const gradientId = `spark-fill-${++SvgGraph.#graphCounter}`;

        const gradient = svgEl("linearGradient", {
            id: gradientId,
            x1: 0, y1: 0,
            x2: 0, y2: 1
        });

        gradient.append(
            svgEl("stop", {
                offset: 0,
                "stop-color": color,
                "stop-opacity": 0.28
            }),
            svgEl("stop", {
                offset: 1,
                "stop-color": color,
                "stop-opacity": 0
            })
        );

        const edgeGradientId = `${gradientId}-edges`;
        const edgeGradient = svgEl("linearGradient", {
            id: edgeGradientId,
            gradientUnits: "userSpaceOnUse",
            x1: 0,
            y1: 0,
            x2: width,
            y2: 0
        });
        edgeGradient.append(
            svgEl("stop", { offset: 0, "stop-color": "black" }),
            svgEl("stop", { offset: 0.18, "stop-color": "white" }),
            svgEl("stop", { offset: 0.82, "stop-color": "white" }),
            svgEl("stop", { offset: 1, "stop-color": "black" })
        );

        const maskId = `${gradientId}-mask`;
        const mask = svgEl("mask", {
            id: maskId,
            maskUnits: "userSpaceOnUse",
            x: 0,
            y: 0,
            width,
            height
        });
        mask.append(svgEl("rect", {
            x: 0,
            y: 0,
            width,
            height,
            fill: `url(#${edgeGradientId})`
        }));

        const defs = svgEl("defs");
        defs.append(gradient, edgeGradient, mask);

        const area = svgEl("path", {
            class: "sparkline-area",
            d: `${d} L${last.x},${height} L${first.x},${height} Z`,
            fill: `url(#${gradientId})`
        });

        const line = svgEl("path", {
            class: "sparkline-line",
            d,
            pathLength: 1,
            fill: "none",
            stroke: color,
            "stroke-width": 1.5,
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        });

        const dot = svgEl("circle", {
            class: "sparkline-dot",
            cx: last.x,
            cy: last.y,
            r: 2.2,
            fill: color
        });

        const graph = svgEl("g", { mask: `url(#${maskId})` });
        graph.append(area, line, dot);

        svg.append(defs, graph);

        return svg;
    }
}

const svgGraph = new SvgGraph();
const hobbies = new HobbyManager();
const heatmap = new ActivityHeatmapManager();


/**
 * HobbyManagerUI
 *
 * Manages the Hobby Manager user interface and its lifecycle.
 *
 * Responsible for:
 * - Creating and managing an isolated Shadow DOM environment.
 * - Loading component-specific stylesheets.
 * - Creating and maintaining the static DOM structure.
 * - Managing hobby and activity manager dependencies.
 * - Maintaining UI state and cached data.
 * - Rendering hobby cards (with nested children) and header controls.
 * - Drawing a floating scrollbar that takes no layout space.
 * - Replacing dynamic content without recreating the static DOM.
 * - Cleaning up resources and removing the component.
 *
 * The supplied parent element remains owned by the caller.
 * This class creates and manages its own host element and Shadow DOM.
 *
 * @class HobbyManagerUI
 */

export default class HobbyManagerUI {

    /**
     * Creates a HobbyManagerUI instance.
     *
     * Initializes data managers, component state, and DOM references.
     * Automatically initializes the component's Shadow DOM and static structure.
     *
     * @param {HTMLElement} parentElement
     *        Parent element in which the component host is created.
     *
     * @throws {TypeError}
     *         If the supplied value is not a valid HTML element.
     */
    constructor(parentElement) {
        if (!parentElement || parentElement.nodeType !== 1) {
            throw new TypeError(
                "HobbyManager requires a valid HTML element."
            );
        }

        this.parentElement = parentElement;
        this.host = null;
        this.shadow = null;
        this.container = null;

        this.time = new Date();
        this.initialized = false;
        this.dataLoaded = false;

        this.state = {
            hobbies: [],
            totalHobbies: 0,
            loading: false
        };
        this.#initialize();
    }

    /**
     * Destroys the Hobby Manager component.
     *
     * Stops observers, removes the component host from the DOM, and
     * releases cached DOM references.
     *
     * The parent element remains untouched.
     * The instance can be initialized again after destruction.
     *
     * @returns {void}
     */
    destroy() {
        if (!this.initialized) return;

        this.scrollObserver?.disconnect();
        this.scrollObserver = null;

        this.host?.remove();
        this.host = null;
        this.shadow = null;
        this.container = null;

        this.#clear_references();
        this.initialized = false;
        this.dataLoaded = false;
    }

    /**
     * Renders hobby information using the supplied data.
     *
     * Replaces previously rendered dynamic content while preserving
     * the static DOM structure and Shadow DOM.
     *
     * Updates the internal UI state before rendering the new content.
     *
     * @param {Object} data
     *        Data required to render the Hobby Manager.
     *
     * @param {string} [data.name="Hobby Manager"]
     *        Heading displayed in the manager.
     *
     * @param {Array<Object>} data.hobbies
     *        Collection of hobby records to render.
     *
     * @returns {void}
     *
     * @throws {TypeError}
     *         If the supplied data or hobbies collection is invalid.
     */
    render(data = {}) {
        if (!this.initialized) return;

        const hobbyEntries = data.hobbies ?? Object.entries(hobbies.get_all(true))
            .map(([id, hobby]) => ({ id, ...hobby }));

        if (!Array.isArray(hobbyEntries)) {
            throw new TypeError(
                "HobbyManagerUI requires a valid hobbies array."
            );
        }

        this.remove_content();
        this.state = {
            hobbies: hobbyEntries,
            totalHobbies: hobbyEntries.length,
            loading: false
        };
        this.dataLoaded = true;
        this.#render_view({
            name: data.name ?? "Hobby Manager",
            totalHobbies: this.state.totalHobbies
        });

        this.hobbyList.replaceChildren(
            ...hobbyEntries.map((hobby, index) => {
                const { id = index, ...record } = hobby;
                return this.#create_hobby_node(id, record);
            })
        );
    }

    /**
     * Clears dynamically rendered content and restores the empty state.
     *
     * Resets the component's internal view state, removes existing hobby
     * cards and header controls, resets the collection count, and renders
     * the empty-state UI.
     *
     * Preserves the host element, Shadow DOM, stylesheet, and static
     * component structure.
     *
     * @returns {void}
     */
    remove_content() {
        if (!this.initialized || !this.container) return;

        this.state = {
            hobbies: [],
            totalHobbies: 0,
            loading: false
        };

        this.dataLoaded = false;
        this.#render_view({ totalHobbies: 0 });
        this.#show_placeholders();
    }


    /**
     * Initializes the Hobby Manager component.
     *
     * Creates the host element, attaches the Shadow DOM, loads the
     * stylesheet, initializes the static DOM structure, and renders
     * the initial empty state.
     *
     * Does nothing if the component is already initialized.
     *
     * @private
     * @returns {void}
     */
    #initialize() {
        if (this.initialized) return;

        try {
            this.host = document.createElement("div");
            this.host.className = "hobby-manager-host";
            this.parentElement.append(this.host);

            this.shadow = this.host.attachShadow({
                mode: "open"
            });

            const stylesheet = document.createElement("link");
            stylesheet.rel = "stylesheet";
            stylesheet.href = new URL("./index.css", import.meta.url).href;

            this.container = document.createElement("div");
            this.container.className = "hobby-manager-content";
            this.container.hidden = true;

            const reveal = () => {
                if (this.container) this.container.hidden = false;
            };

            stylesheet.addEventListener("load", reveal);
            stylesheet.addEventListener("error", reveal);
            this.shadow.append(stylesheet, this.container);

            this.initialized = true;
            this.#initialize_structure();
            this.remove_content();

        } catch (error) {
            console.error("HobbyManagerUI failed to initialize:", error);
            this.destroy();
        }
    }

    /**
     * Creates the permanent DOM structure of the Hobby Manager.
     *
     * Generates the component layout, caches references to frequently
     * accessed DOM elements, and attaches the list and scrollbar behaviour.
     *
     * This structure is preserved when dynamic content is replaced.
     *
     * @private
     * @returns {void}
     */
    #initialize_structure() {
        const heading = "Hobby Manager";
        this.container.innerHTML = `
            <div class="main-manager">
                <main class="manager">
                    <header class="manager-header">
                        <div class="manager-heading">
                            <p class="manager-heading-lable">${heading}</p>
                            <p class="manager-heading-total"></p>
                        </div>
                        <div class="header-options" aria-label="Hobby manager actions"></div>
                    </header>

                    <div class="manager-scroll">
                        <section class="manager-content" aria-label="Hobbies">
                            <div class="hobby-list"></div>
                        </section>
                        <div class="scroll-track" aria-hidden="true">
                                <div class="scroll-thumb"></div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.headerText = this.container.querySelector(".manager-heading-lable");
        this.headerTotalText = this.container.querySelector(".manager-heading-total");
        this.headerOptions = this.container.querySelector(".header-options");
        this.managerScroll = this.container.querySelector(".manager-scroll");
        this.managerContent = this.container.querySelector(".manager-content");
        this.scrollTrack = this.container.querySelector(".scroll-track");
        this.scrollThumb = this.container.querySelector(".scroll-thumb");
        this.hobbyList = this.container.querySelector(".hobby-list");

        this.#initialize_list_events();
        this.#initialize_scrollbar();
    }

    /**
    * Attaches one click and one keyboard listener to the hobby list
    * (event delegation), so re-rendering cards never needs new listeners.
    *
    * @private
    * @returns {void}
    */
    #initialize_list_events() {
        this.hobbyList.addEventListener("click", (event) => {
            const target = event.target;

            const toggle = target.closest(".card-toggle");
            if (toggle) {
                this.#toggle_group(toggle.closest(".hobby-group"));
                return;
            }

            const card = target.closest(".hobby-card:not(.fakedata)");
            if (card) this.#onClickHobby(card.dataset.hobbyId);
        });

        this.hobbyList.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                const card = event.target.closest(".hobby-card:not(.fakedata)");

                if (card) {
                    event.preventDefault();
                    this.#onClickHobby(card.dataset.hobbyId);
                }
            }
        });
    }


    /**
     * Initializes a floating custom scrollbar for the hobby manager.
     *
     * The native scrollbar remains hidden while native scrolling works.
     * The custom scrollbar supports:
     * - Visibility while scrolling or hovering near the right edge.
     * - Pointer-based thumb dragging.
     * - Page scrolling when clicking the empty track.
     * - Automatic hiding after inactivity.
     * - Automatic resizing when content or container dimensions change.
     *
     * @private
     * @returns {void}
     */
    #initialize_scrollbar() {
        const wrap = this.managerScroll;
        const box = this.managerContent;
        const track = this.scrollTrack;
        const thumb = this.scrollThumb;

        let hideTimer;
        let dragging = false;
        let startY = 0;
        let startScroll = 0;

        // Cached dimensions, updated only when layout changes.
        let range = 0;
        let maxTop = 0;

        const setClass = (name, enabled) => {
            if (wrap.classList.contains(name) !== enabled) {
                wrap.classList.toggle(name, enabled);
            }
        };

        const show = () => {
            clearTimeout(hideTimer);
            setClass("is-scrolling", true);
        };

        const hide = () => {
            if (dragging) return;

            hideTimer = setTimeout(() => {
                setClass("is-scrolling", false);
            }, 700);
        };

        // Calculate thumb dimensions and position.
        const update = () => {
            const { scrollTop, scrollHeight, clientHeight } = box;

            range = scrollHeight - clientHeight;
            const scrollable = range > 1;

            setClass("is-scrollable", scrollable);

            if (!scrollable) {
                thumb.style.height = "0px";
                thumb.style.transform = "translateY(0)";
                return;
            }

            const trackHeight = track.clientHeight;
            const thumbHeight = Math.min(
                trackHeight,
                Math.max(32, (clientHeight / scrollHeight) * trackHeight)
            );

            maxTop = trackHeight - thumbHeight;

            thumb.style.height = `${thumbHeight}px`;
            thumb.style.transform =
                `translateY(${maxTop * (scrollTop / range)}px)`;
        };

        // Native scrolling.
        const onScroll = () => {
            update();
            show();
            hide();
        };

        // Pointer proximity to the right edge.
        const onPointerMove = (event) => {
            if (event.pointerType === "touch") return;

            setClass(
                "is-near-edge",
                event.clientX > wrap.getBoundingClientRect().right - 28
            );
        };

        const onPointerLeave = () => {
            setClass("is-near-edge", false);
        };

        // Start dragging.
        const onDragStart = (event) => {
            if (event.button !== 0 && event.pointerType === "mouse") return;
            if (range <= 1 || maxTop <= 0) return;

            event.preventDefault();

            dragging = true;
            startY = event.clientY;
            startScroll = box.scrollTop;

            show();
            setClass("is-dragging", true);

            thumb.setPointerCapture(event.pointerId);
        };

        // Move thumb.
        const onDragMove = (event) => {
            if (!dragging) return;

            box.scrollTop = startScroll +
                ((event.clientY - startY) / maxTop) * range;
        };

        // End dragging.
        const onDragEnd = () => {
            if (!dragging) return;

            dragging = false;
            setClass("is-dragging", false);
            hide();
        };

        // Track click.
        const onTrackClick = (event) => {
            if (event.target !== track || range <= 1) return;

            const thumbRect = thumb.getBoundingClientRect();

            const direction = event.clientY < thumbRect.top
                ? -1
                : event.clientY > thumbRect.bottom
                    ? 1
                    : 0;

            if (!direction) return;

            show();

            box.scrollBy({
                top: direction * box.clientHeight * 0.9,
                behavior: "smooth"
            });

            hide();
        };

        // Observe layout changes.
        const observer = new ResizeObserver(update);

        observer.observe(box);
        observer.observe(this.hobbyList);

        // Register events.
        box.addEventListener("scroll", onScroll, { passive: true });

        wrap.addEventListener("pointermove", onPointerMove);
        wrap.addEventListener("pointerleave", onPointerLeave);

        thumb.addEventListener("pointerdown", onDragStart);
        thumb.addEventListener("pointermove", onDragMove);
        thumb.addEventListener("pointerup", onDragEnd);
        thumb.addEventListener("pointercancel", onDragEnd);
        thumb.addEventListener("lostpointercapture", onDragEnd);

        track.addEventListener("pointerdown", onTrackClick);

        // Initial calculation.
        update();

        // Cleanup.
        this.scrollObserver = observer;

        this.scrollbarCleanup = () => {
            observer.disconnect();
            clearTimeout(hideTimer);

            box.removeEventListener("scroll", onScroll);

            wrap.removeEventListener("pointermove", onPointerMove);
            wrap.removeEventListener("pointerleave", onPointerLeave);

            thumb.removeEventListener("pointerdown", onDragStart);
            thumb.removeEventListener("pointermove", onDragMove);
            thumb.removeEventListener("pointerup", onDragEnd);
            thumb.removeEventListener("pointercancel", onDragEnd);
            thumb.removeEventListener("lostpointercapture", onDragEnd);

            track.removeEventListener("pointerdown", onTrackClick);

            wrap.classList.remove(
                "is-scrollable",
                "is-scrolling",
                "is-near-edge",
                "is-dragging"
            );
        };
    }

    /**
     * Releases cached references to component DOM elements.
     *
     * Called during component destruction to prevent the instance
     * from retaining references to removed DOM nodes.
     *
     * @private
     * @returns {void}
     */
    #clear_references() {
        this.headerText = null;
        this.headerTotalText = null;
        this.headerOptions = null;
        this.managerScroll = null;
        this.managerContent = null;
        this.scrollTrack = null;
        this.scrollThumb = null;
        this.hobbyList = null;
    }

    /**
     * Shows skeleton placeholder cards built from the fake data,
     * including its child hobbies.
     *
     * @private
     * @returns {void}
     */
    #show_placeholders() {
        const graph = getFakeGraphData();

        this.hobbyList.replaceChildren(
            ...Object.entries(getFakeHobbiesData()).map(([id, hobby]) =>
                this.#create_hobby_node(id, hobby, graph, true)
            )
        );
    }

    /**
     * Renders the manager heading and header action controls.
     *
     * Updates the collection summary and renders the available
     * header actions: search, filter, and create.
     *
     * @private
     *
     * @param {Object} [options={}]
     *        Header rendering configuration.
     *
     * @param {number} [options.totalHobbies=0]
     *        Number of hobbies in the current collection.
     *
     * @returns {void}
     */
    #render_view({ name, totalHobbies = 0 } = {}) {

        if (name) this.headerText.textContent = name;
        this.headerTotalText.textContent =
            `${totalHobbies} hobbies in your collection`;

        const actions = [
            { name: "search", label: "Search hobbies", handler: () => this.#onClickSearch() },
            { name: "filter", label: "Filter hobbies", handler: () => this.#onClickFilter() },
            { name: "create", label: "Create hobby", handler: () => this.#onClickCreate() }
        ];

        const buttons = actions.map(({ name, label, handler }) => {
            const button = el("button", `header-button ${name}-button`);

            button.type = "button";
            button.disabled = !this.dataLoaded;
            button.setAttribute("aria-label", label);
            button.innerHTML = ICONS[name];
            button.addEventListener("click", handler);

            return button;
        });

        this.headerOptions.replaceChildren(...buttons);
    }

    /**
    * Creates a hobby card together with its children (recursively).
    *
    * Returns a group element: the card, followed (if the hobby has
    * children) by a collapsible container that holds one group per child.
    *
    * @private
    *
    * @param {string|number} id           Hobby id.
    * @param {Object} hobby               Hobby record (may contain `children`).
    * @param {Object} [graph]             Fallback graph data when the hobby has none.
    * @param {boolean} [isPlaceholder=false]  Render as a skeleton card.
    *
    * @returns {HTMLDivElement}
    */
    #create_hobby_node(id, hobby, graph, isPlaceholder = false) {
        const children = Object.entries(hobby.children ?? {});
        const graphData = hobby.graph ?? graph ?? this.#get_year_graph(id, hobby);

        const group = el("div", "hobby-group");
        group.dataset.hobbyId = id;

        group.append(
            this.#create_hobbie_card(id, hobby, graphData, isPlaceholder, children.length)
        );

        if (children.length) {
            const wrapper = el("div", "hobby-children");
            const inner = el("div", "hobby-children-inner");
            const list = el("div", "hobby-children-list");

            list.append(
                ...children.map(([childId, child]) =>
                    this.#create_hobby_node(childId, child, graph, isPlaceholder)
                )
            );

            inner.append(list);
            wrapper.append(inner);
            group.append(wrapper);
        }

        return group;

    }

    #get_year_graph(id, hobby) {
        const year = this.time.getFullYear();
        const values = Array(12).fill(0);
        let hasActivityData = false;

        for (let month = 0; month < values.length; month++) {
            let dailyEntries;

            try {
                dailyEntries = heatmap.get(year, month, String(id))[id];
            } catch {
                continue;
            }

            if (!dailyEntries?.length) continue;
            hasActivityData = true;

            values[month] = dailyEntries.reduce((total, entry) => {
                const target = Number(entry.target);
                const completion = target > 0
                    ? entry.amount / target
                    : entry.amount > 0 ? 1 : 0;

                return total + Math.max(0, Math.min(1, completion));
            }, 0) / dailyEntries.length;
        }

        if (!hasActivityData) return null;

        return {
            color: hobby.color ?? "var(--accent)",
            values
        };
    }

    /**
    * Creates a single hobby card element.
    *
    * Builds a card containing a coloured initial tile, the hobby name
    * (with a collapse button when it has children), the description,
    * the daily target and the activity sparkline.
    *
    * Does not retrieve or modify hobby data. All information
    * is provided through the supplied arguments.
    *
    * @private
    *
    * @param {string|number} id
    * @param {Object} hobby
    * @param {Object} [graph]
    * @param {boolean} [isPlaceholder=false]
    * @param {number} [childCount=0]
    *
    * @returns {HTMLDivElement}
    */
    #create_hobbie_card(id, hobby, graph, isPlaceholder = false, childCount = 0) {
        const card = el("div", isPlaceholder ? "hobby-card fakedata" : "hobby-card");
        card.dataset.hobbyId = id;
        card.style.setProperty("--hobby-color", hobby.color ?? graph?.color ?? "var(--accent)");

        if (isPlaceholder) {
            card.setAttribute("aria-hidden", "true");
        } else {
            card.tabIndex = 0;
        }

        const name = hobby.name || "Untitled hobby";

        const lead = el("div", "card-lead", name.trim().charAt(0).toUpperCase());
        lead.setAttribute("aria-hidden", "true");

        const nameRow = el("div", "card-name-row");
        nameRow.append(el("span", "card-name", name));
        if (childCount > 0 && !isPlaceholder) {
            nameRow.append(this.#create_toggle(childCount));
        }

        const text = el("div", "card-text");
        text.append(
            nameRow,
            el("p", "card-desc", hobby.description || "Make a little time for what you enjoy.")
        );

        const target = hobby.unit_type === "boolean"
            ? "Daily habit"
            : hobby.target != null
                ? `${hobby.target} ${hobby.unit_name} / day`
                : "No target yet";

        const graphBox = el("div", "card-graph");
        if (!isPlaceholder) {
            if (graph?.values?.length) {
                graphBox.append(svgGraph.create(graph));
            } else {
                graphBox.append(el("span", "card-graph-empty", "No activity data"));
            }
        }

        const side = el("div", "card-side");
        side.append(graphBox, el("span", "card-meta", target));

        card.append(lead, text, side);
        return card;
    }

    /**
     * Creates the small "chevron + count" button that collapses or
     * expands a hobby's children.
     *
     * @private
     * @param {number} count  Number of child hobbies.
     * @returns {HTMLButtonElement}
     */
    #create_toggle(count) {
        const button = el("button", "card-toggle");
        button.type = "button";
        button.setAttribute("aria-expanded", "true");
        button.setAttribute("aria-label", "Collapse sub-hobbies");
        button.innerHTML = ICONS.chevron;
        button.append(el("span", "", String(count)));
        return button;
    }

    /**
     * Collapses or expands the children of a hobby group.
     *
     * @private
     * @param {HTMLElement|null} group
     * @returns {void}
     */
    #toggle_group(group) {
        if (!group) return;

        const collapsed = group.classList.toggle("is-collapsed");
        const children = group.querySelector(":scope > .hobby-children");
        const button = group.querySelector(":scope > .hobby-card .card-toggle");

        // `inert` removes collapsed children from tab order and screen readers
        children?.toggleAttribute("inert", collapsed);
        button?.setAttribute("aria-expanded", String(!collapsed));
        button?.setAttribute("aria-label", collapsed ? "Expand sub-hobbies" : "Collapse sub-hobbies");
    }

    #onClickHobby(id) { console.log("hobby clicked", id) }
    #onClickSearch() { if (!this.dataLoaded) { return }; console.log("search button clicked") }
    #onClickFilter() { if (!this.dataLoaded) { return }; console.log("filter button clicked") }
    #onClickCreate() { if (!this.dataLoaded) { return }; console.log("create button clicked") }
}
