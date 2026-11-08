import {
	SHORT_MONTHS,
	HobbyManager,
	ActivityManager,
	HobbyPlannerManager,
	getSectionIdFilterByPlanner
} from "../dataFacther.js";

const hobbyManager = new HobbyManager();
const activityManager = new ActivityManager();
const hobbyPlannerManager = new HobbyPlannerManager();

const MONTH_WIDTH = 100;


/**
 * HobbyPlanner
 *
 * Manages the Hobby Planner interface and its rendering lifecycle.
 *
 * Responsible for:
 * - Creating and managing an isolated Shadow DOM.
 * - Loading the planner stylesheet.
 * - Creating and caching planner DOM elements.
 * - Preparing planner and activity data for a selected month.
 * - Rendering planner labels, month headers, and activity timelines.
 * - Managing timeline navigation and resize interactions.
 *
 * The supplied parent element remains owned by the caller. The class
 * creates and manages its own host and Shadow DOM.
 *
 * @class HobbyPlanner
 */
export default class HobbyPlanner {

	/**
	 * Creates a HobbyPlanner instance.
	 *
	 * @param {HTMLElement} parentElement
	 *        Parent element in which the planner host is created.
	 *
	 * @throws {TypeError}
	 *         If the supplied value is not an HTML element.
	 */
	constructor(parentElement) {
		if (!parentElement || parentElement.nodeType !== 1) {
			throw new TypeError("HobbyPlanner requires a valid HTML element.");
		}

		this.parentElement = parentElement;

		// Shadow DOM references.
		this.host = null;
		this.shadow = null;
		this.container = null;

		// Planner state.
		this.time = new Date();
		this.initialized = false;
		this.selectedIndex = 0;
		this.monthData = [[], []];
		this.plannerData = null;
		this.slotRows = [];
		this.hobbyCache = new Map();

		// Interaction state.
		this.wheelTimer = null;
		this.wheelDirection = 0;

		// Persistent event handlers.
		this.wheelHandler = (event) => this.#handleWheel(event);
		this.resizeHandler = () => this.#handleResize();

		this.#initialize();
	}

	/**
	 * Initializes the planner interface.
	 *
	 * Creates the host, attaches Shadow DOM, loads the stylesheet,
	 * creates the base layout, caches DOM references, and renders
	 * the initial placeholder preview.
	 *
	 * No planner or activity data is retrieved during initialization.
	 *
	 * The method is safe to call again while already initialized.
	 */
	initialize() {
		if (this.initialized) return;
		this.#initialize();
	}

	/**
	 * Initializes the component's DOM and initial content.
	 *
	 * @private
	 */
	#initialize() {
		if (this.initialized) return;

		try {
			this.#create_dom();
			this.initialized = true;
			this.render_content();
		} catch (error) {
			this.host?.remove();

			this.host = null;
			this.shadow = null;
			this.container = null;
			this.initialized = false;

			throw error;
		}
	}

	/**
	 * Creates the host element and attaches its Shadow DOM.
	 *
	 * Loads the planner stylesheet and creates the main content container.
	 */
	#create_dom() {
		this.host = document.createElement("div");
		this.host.className = "hobby-planner-host";

		this.parentElement.append(this.host);

		this.shadow = this.host.attachShadow({
			mode: "open"
		});

		const stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.href = new URL("./index.css", import.meta.url).href;

		this.container = document.createElement("div");
		this.container.className = "hobby-planner-content";

		this.shadow.append(stylesheet, this.container);
	}

	/**
	 * Renders the base planner interface and placeholder preview.
	 *
	 * Creates the layout, caches its DOM references, and binds persistent
	 * interaction listeners. No planner or activity data is retrieved here.
	 */
	render_content() {
		if (!this.initialized || !this.container) return;

		this.container.innerHTML = `
            <main class="tracker">
                <section class="labels" aria-label="Hobby planner labels">
                    <p class="lable-heading">Hobby Planner</p>
                    <div class="label-list"></div>
                </section>

                <section class="timeline-viewport" aria-label="Hobby planner timeline">
                    <div class="timeline">
                        <div class="timeline-track">
                            <div class="timeline-months-row"></div>
                            <div class="timeline-data">
                                <div class="timeline-grid" aria-hidden="true"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>`;

		// Cache DOM references.
		this.heading = this.container.querySelector(".lable-heading");
		this.labelList = this.container.querySelector(".label-list");
		this.timeline = this.container.querySelector(".timeline");
		this.track = this.container.querySelector(".timeline-track");
		this.monthRow = this.container.querySelector(".timeline-months-row");
		this.timelineData = this.container.querySelector(".timeline-data");
		this.timelineGrid = this.container.querySelector(".timeline-grid");

		// Bind persistent interaction listeners.
		this.timeline.addEventListener("wheel", this.wheelHandler, {
			passive: false
		});

		window.addEventListener("resize", this.resizeHandler);

		this.#renderPlaceholder();
	}

	/**
	 * Clears rendered content and releases UI-specific resources.
	 *
	 * Removes event listeners, clears pending timers, clears the container,
	 * and resets cached DOM and planner-rendering state. The host and Shadow
	 * DOM remain until destroy() is called.
	 */
	remove_content() {
		if (!this.container) return;

		clearTimeout(this.wheelTimer);
		this.wheelTimer = null;

		this.timeline?.removeEventListener(
			"wheel",
			this.wheelHandler
		);

		window.removeEventListener(
			"resize",
			this.resizeHandler
		);

		this.container.replaceChildren();

		// Clear cached DOM references.
		this.heading = null;
		this.labelList = null;
		this.timeline = null;
		this.track = null;
		this.monthRow = null;
		this.timelineData = null;
		this.timelineGrid = null;

		// Reset planner state.
		this.selectedIndex = 0;
		this.monthData = [[], []];
		this.plannerData = null;
		this.slotRows = [];
		this.hobbyCache.clear();
		this.wheelDirection = 0;
	}

	/**
	 * Destroys the planner interface and releases its resources.
	 *
	 * Cleans up rendered content, removes the host from its parent,
	 * clears DOM references, and resets the lifecycle state.
	 *
	 * The instance can be initialized again after destruction.
	 */
	destroy() {
		if (!this.initialized) return;

		this.remove_content();

		this.host?.remove();

		this.host = null;
		this.shadow = null;
		this.container = null;

		this.initialized = false;
	}

	/**
	 * Renders the planner for the requested year and month.
	 *
	 * Uses the instance's current year and month when arguments are omitted.
	 * Every successful call replaces the previous rendered data without
	 * recreating the base interface or registering duplicate listeners.
	 *
	 * Data is prepared before the existing view is cleared. If data retrieval
	 * fails, the currently displayed planner remains intact.
	 *
	 * @param {number|null} [year=null]
	 *        Requested year (e.g. 2026).
	 *
	 * @param {number|null} [month=null]
	 *        Requested zero-based month index (0–11).
	 *
	 * @throws {Error}
	 *         If the instance has not been initialized.
	 *
	 * @throws {RangeError}
	 *         If the requested year or month is invalid.
	 */
	render(year = null, month = null) {
		if (!this.initialized) {
			throw new Error("HobbyPlanner must be initialized before rendering.");
		}

		year ??= this.time.getFullYear();
		month ??= this.time.getMonth();

		this.#validateDate(year, month);

		const preparedData = this.#prepareHobbyData(year, month);

		this.emptyHtmlElements();

		this.plannerData = preparedData.plannerData;
		this.monthData = preparedData.monthData;
		this.selectedIndex = 0;
		this.slotRows = [];

		this.#renderLeftLabel();
		this.#renderRightMonth();
		this.#renderRightActivity();
		this.#updateLayout();

		this.timeline.scrollTo({
			left: 0,
			behavior: "auto"
		});
	}

	/**
	 * Clears content generated by the data renderer while preserving the
	 * timeline grid container and the initialized base layout.
	 */
	emptyHtmlElements() {
		this.monthRow.replaceChildren();
		this.labelList.replaceChildren();
		this.timelineData.replaceChildren(this.timelineGrid);
		this.timelineGrid.replaceChildren();

		this.heading.textContent = "Hobby Planner";
	}

	/**
	 * Validates the requested year and month.
	 *
	 * @param {number} year
	 *        Positive integer representing the year.
	 *
	 * @param {number} month
	 *        Zero-based month index (0–11).
	 *
	 * @throws {RangeError}
	 *         If the year or month is outside the allowed range.
	 */
	#validateDate(year, month) {
		if (!Number.isInteger(month) || month < 0 || month > 11) {
			throw new RangeError("Month must be an integer between 0 and 11.");
		}

		if (!Number.isInteger(year) || year < 1) {
			throw new RangeError("Year must be a valid positive integer.");
		}
	}

	/**
	 * Prepares planner and activity data for the requested date.
	 *
	 * Each month entry retains its year and zero-based month index so the
	 * renderer can display the correct month label after the data is grouped
	 * into current-year and previous-year collections.
	 *
	 * @param {number} year
	 *        Requested year.
	 *
	 * @param {number} month
	 *        Requested zero-based month index.
	 *
	 * @returns {{plannerData: Object, monthData: Array<Array<Object>>}}
	 *          Planner state and two month collections. Each month entry has
	 *          the shape { year, month, activities }.
	 */
	#prepareHobbyData(year, month) {
		const plannerData = hobbyPlannerManager.get(year, month);
		const filterobj = getSectionIdFilterByPlanner(plannerData);

		// The manager expects the section filter inside the filter options.
		const activityFilter = {
			onlysectionid: filterobj
		};

		const currentYearData = activityManager.get_by_month(
			plannerData.year,
			0,
			plannerData.month,
			activityFilter,
			{ throwOnEmpty: false }
		);

		const previousYearData = plannerData.month < 11
			? activityManager.get_by_month(
				plannerData.year - 1,
				plannerData.month + 1,
				11,
				activityFilter,
				{ throwOnEmpty: false }
			)
			: {};

		const currentYearMonths = Array.from(
			{ length: plannerData.month + 1 },
			(_, index) => plannerData.month - index
		);

		const previousYearMonths = Array.from(
			{ length: 11 - plannerData.month },
			(_, index) => 11 - index
		);

		const convertToList = (data, months, targetYear) =>
			months.map(monthIndex => ({
				year: targetYear,
				month: monthIndex,
				activities: data[monthIndex] ?? []
			}));

		return {
			plannerData,
			monthData: [
				convertToList(
					currentYearData,
					currentYearMonths,
					plannerData.year
				),
				convertToList(
					previousYearData,
					previousYearMonths,
					plannerData.year - 1
				)
			]
		};
	}

	/**
	 * Returns the month entries in timeline display order.
	 *
	 * @returns {Array<Object>}
	 *          Current-year months followed by previous-year months.
	 */
	#getTimelineMonths() {
		return [
			...this.monthData[0],
			...this.monthData[1]
		];
	}

	/**
	 * Retrieves the activity record assigned to a section slot in a month.
	 *
	 * @param {Array<Object>} activities
	 *        Activity records for one month.
	 *
	 * @param {string} sectionId
	 *        Planner section ID.
	 *
	 * @param {number} slotIndex
	 *        Slot index within the section.
	 *
	 * @returns {Object|null}
	 *          Matching activity record, or null when the slot is empty.
	 */
	#getSlotActivity(activities, sectionId, slotIndex) {
		return activities.find(activity =>
			String(activity.sectionid) === String(sectionId) &&
			activity.slot === slotIndex
		) ?? null;
	}

	/**
	 * Retrieves hobby metadata, caching each resolved hobby for this render
	 * lifecycle.
	 *
	 * @param {string} hobbyId
	 *        Hobby identifier.
	 *
	 * @returns {Object|null}
	 *          Hobby metadata, or null when the hobby does not exist.
	 */
	#getHobby(hobbyId) {
		if (!this.hobbyCache.has(hobbyId)) {
			this.hobbyCache.set(
				hobbyId,
				hobbyManager.get(hobbyId)
			);
		}

		return this.hobbyCache.get(hobbyId);
	}

	/**
	 * Renders the initial placeholder preview shown after initialization.
	 *
	 * This is presentation-only demo content. It does not use or modify
	 * planner, hobby, or activity data.
	 */
	#renderPlaceholder() {
		const demoSections = [
			{ title: "Planning", rows: 2 },
			{ title: "Creative", rows: 2 },
			{ title: "Learning", rows: 1 }
		];

		const currentMonth = this.time.getMonth();

		const demoMonths = Array.from(
			{ length: 6 },
			(_, index) => SHORT_MONTHS[
				(currentMonth - index + 12) % 12
			]
		);

		this.heading.textContent = "Hobby Planner";
		this.monthRow.replaceChildren();
		this.labelList.replaceChildren();
		this.timelineData.replaceChildren(this.timelineGrid);
		this.timelineGrid.replaceChildren();

		for (const month of demoMonths) {
			const monthElement = document.createElement("div");
			monthElement.className = "timeline-month is-placeholder";
			monthElement.textContent = month;
			monthElement.style.opacity = "0.55";

			this.monthRow.append(monthElement);

			const gridCell = document.createElement("span");
			gridCell.className = "timeline-grid-cell is-placeholder";

			this.timelineGrid.append(gridCell);
		}

		let rowIndex = 0;

		for (const section of demoSections) {
			const sectionLabel = document.createElement("div");
			sectionLabel.className = "label-section-row is-placeholder";
			sectionLabel.textContent = section.title;
			sectionLabel.style.minHeight = "30px";
			sectionLabel.style.opacity = "0.65";

			this.labelList.append(sectionLabel);

			const sectionTimeline = document.createElement("div");
			sectionTimeline.className = "timeline-section-row is-placeholder";
			sectionTimeline.style.minHeight = "30px";

			this.timelineData.append(sectionTimeline);

			for (let index = 0; index < section.rows; index += 1) {
				const label = document.createElement("div");

				label.className =
					"lable-row depth-1 is-placeholder is-empty";

				label.setAttribute("aria-hidden", "true");
				label.style.minHeight = "34px";

				this.labelList.append(label);

				const row = document.createElement("div");

				row.className = "timeline-activity-row is-placeholder";
				row.style.minHeight = "34px";
				row.style.display = "grid";

				row.style.gridTemplateColumns =
					`repeat(${demoMonths.length}, ${MONTH_WIDTH}px)`;

				const bar = document.createElement("span");

				bar.className = "activity-bar is-placeholder";

				bar.style.gridColumn =
					`${(rowIndex % 3) + 1} / ${Math.min(
						demoMonths.length + 1,
						(rowIndex % 3) + 3
					)}`;

				bar.style.opacity = "0.22";
				bar.style.minHeight = "14px";
				bar.style.alignSelf = "center";

				row.append(bar);
				this.timelineData.append(row);

				rowIndex += 1;
			}
		}

		const placeholderWidth = demoMonths.length * MONTH_WIDTH;

		const placeholderColumns =
			`repeat(${demoMonths.length}, ${MONTH_WIDTH}px)`;

		this.track.style.setProperty(
			"--content-width",
			`${placeholderWidth}px`
		);

		this.track.style.setProperty("--tail-width", "0px");

		this.monthRow.style.gridTemplateColumns = placeholderColumns;
		this.monthRow.style.width = `${placeholderWidth}px`;

		this.timelineGrid.style.gridTemplateColumns = placeholderColumns;
		this.timelineGrid.style.width = `${placeholderWidth}px`;

		this.timelineData.style.width = `${placeholderWidth}px`;

		this.timelineData
			.querySelectorAll(".timeline-activity-row")
			.forEach(row => {
				row.style.gridTemplateColumns = placeholderColumns;
				row.style.width = `${placeholderWidth}px`;
			});
	}

	/**
	 * Renders section headings and slot labels for the selected month.
	 */
	#renderLeftLabel() {
		const planner = this.plannerData;
		const sections = planner.data;

		const order = Array.isArray(planner.order)
			? planner.order
			: Object.keys(sections);

		const selectedMonth =
			this.#getTimelineMonths()[this.selectedIndex];

		this.heading.textContent = planner.title ?? "Hobby Planner";
		this.slotRows = [];

		for (const sectionId of order) {
			const section = sections[sectionId];

			if (!section) continue;

			const sectionLabel = document.createElement("div");
			sectionLabel.className = "label-section-row";
			sectionLabel.textContent =
				section.title ?? `Section ${sectionId}`;

			sectionLabel.dataset.sectionId = sectionId;

			this.labelList.append(sectionLabel);

			this.slotRows.push({
				type: "section",
				sectionId
			});

			for (
				let slotIndex = 0;
				slotIndex < section.slotsAllow;
				slotIndex += 1
			) {
				const activity = this.#getSlotActivity(
					selectedMonth?.activities ?? [],
					sectionId,
					slotIndex
				);

				const hobby = activity
					? this.#getHobby(activity.id)
					: null;

				const label = document.createElement("div");

				label.className = "lable-row depth-1";
				label.dataset.sectionId = sectionId;
				label.dataset.slot = String(slotIndex);

				if (!hobby) {
					label.classList.add("is-empty");

					label.setAttribute(
						"aria-label",
						`Empty slot ${slotIndex + 1}`
					);
				} else {
					const dot = document.createElement("span");
					dot.className = "dot";
					dot.style.backgroundColor = hobby.color;

					const text = document.createElement("span");
					text.className = "lable-text";

					const name = document.createElement("p");
					name.className = "lable-name";
					name.textContent = hobby.name;

					text.append(name);

					label.title =
						`${section.title}: ${hobby.description ?? hobby.name}`;

					label.append(dot, text);
				}

				this.labelList.append(label);

				this.slotRows.push({
					type: "slot",
					sectionId,
					slotIndex
				});
			}
		}
	}

	/**
	 * Renders month headers and their corresponding background grid cells.
	 */
	#renderRightMonth() {
		const months = this.#getTimelineMonths();

		months.forEach((monthData, index) => {
			const monthElement = document.createElement("div");
			monthElement.className = "timeline-month";

			monthElement.textContent = SHORT_MONTHS[monthData.month];

			monthElement.dataset.month =
				`${monthData.year}-${String(
					monthData.month + 1
				).padStart(2, "0")}`;

			monthElement.title =
				`${SHORT_MONTHS[monthData.month]} ${monthData.year}`;

			monthElement.addEventListener("click", () =>
				this.#selectMonth(index)
			);

			this.monthRow.append(monthElement);

			const gridCell = document.createElement("span");
			gridCell.className = "timeline-grid-cell";
			gridCell.dataset.month = monthElement.dataset.month;

			this.timelineGrid.append(gridCell);
		});
	}

	/**
	 * Renders one timeline row for every planner section slot and merges
	 * adjacent months with the same hobby into a continuous activity bar.
	 */
	#renderRightActivity() {
		const months = this.#getTimelineMonths();

		for (const entry of this.slotRows) {
			if (entry.type === "section") {
				const sectionRow = document.createElement("div");

				sectionRow.className = "timeline-section-row";
				sectionRow.dataset.sectionId = entry.sectionId;

				this.timelineData.append(sectionRow);
				continue;
			}

			const { sectionId, slotIndex } = entry;

			const row = document.createElement("div");

			row.className = "timeline-activity-row";
			row.dataset.sectionId = sectionId;
			row.dataset.slot = String(slotIndex);

			let activeStart = null;
			let activeHobby = null;

			for (
				let displayIndex = 0;
				displayIndex <= months.length;
				displayIndex += 1
			) {
				const month = months[displayIndex];

				const activity = month
					? this.#getSlotActivity(
						month.activities,
						sectionId,
						slotIndex
					)
					: null;

				const hobby = activity
					? this.#getHobby(activity.id)
					: null;

				const hobbyChanged =
					hobby?.id !== activeHobby?.id;

				if (activeHobby && (!hobby || hobbyChanged)) {
					const bar = document.createElement("div");

					bar.className =
						`activity-bar ${this.#hobbyClass(activeHobby.id)}`;

					bar.style.gridColumn =
						`${activeStart + 1} / ${displayIndex + 1}`;

					bar.style.backgroundColor = activeHobby.color;
					bar.title = activeHobby.name;
					bar.dataset.hobbyId = activeHobby.id;

					row.append(bar);

					activeStart = null;
				}

				if (hobby && (!activeHobby || hobbyChanged)) {
					activeStart = displayIndex;
				}

				activeHobby = hobby;
			}

			this.timelineData.append(row);
		}
	}

	/**
	 * Selects a month in the timeline.
	 *
	 * Updates the selected month index and refreshes the labels and activity
	 * rows to reflect the selected month's planner assignments.
	 *
	 * @param {number} index
	 *        Index of the month in the timeline.
	 */
	#selectMonth(index) {
		const months = this.#getTimelineMonths();

		if (
			!Number.isInteger(index) ||
			index < 0 ||
			index >= months.length
		) {
			return;
		}

		this.selectedIndex = index;

		this.monthRow
			.querySelectorAll(".timeline-month")
			.forEach((element, monthIndex) => {
				element.classList.toggle(
					"selected",
					monthIndex === this.selectedIndex
				);
			});

		this.#renderSelectedLabels();
		this.#updateLayout();

		const selectedElement =
			this.monthRow.children[this.selectedIndex];

		selectedElement?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "nearest"
		});
	}

	/**
	 * Refreshes the left-side labels and their selected-month assignments.
	 *
	 * This method only updates the labels. The timeline activity bars remain
	 * unchanged because they represent activity across all displayed months.
	 */
	#renderSelectedLabels() {
		this.labelList.replaceChildren();

		const selectedMonth =
			this.#getTimelineMonths()[this.selectedIndex];

		if (!selectedMonth) return;

		const sections = this.plannerData.data;

		const order = this.plannerData.order
			?? Object.keys(sections);

		for (const sectionId of order) {
			const section = sections[sectionId];

			if (!section) continue;

			const sectionLabel = document.createElement("div");

			sectionLabel.className = "label-section-row";
			sectionLabel.textContent =
				section.title ?? `Section ${sectionId}`;

			this.labelList.append(sectionLabel);

			for (
				let slotIndex = 0;
				slotIndex < section.slotsAllow;
				slotIndex += 1
			) {
				const activity = this.#getSlotActivity(
					selectedMonth.activities,
					sectionId,
					slotIndex
				);

				const hobby = activity
					? this.#getHobby(activity.id)
					: null;

				const label = document.createElement("div");

				label.className = "lable-row depth-1";
				label.dataset.sectionId = sectionId;
				label.dataset.slot = String(slotIndex);

				if (!hobby) {
					label.classList.add("is-empty");

					label.setAttribute(
						"aria-label",
						`Empty slot ${slotIndex + 1}`
					);
				} else {
					const dot = document.createElement("span");
					dot.className = "dot";

					if (hobby.color) {
						dot.style.backgroundColor = hobby.color;
					}

					const text = document.createElement("span");
					text.className = "lable-text";

					const name = document.createElement("p");
					name.className = "lable-name";
					name.textContent = hobby.name ?? activity.id;

					text.append(name);
					label.append(dot, text);
				}

				this.labelList.append(label);
			}
		}
	}

	/**
	 * Handles mouse-wheel navigation through the timeline.
	 *
	 * Supports both horizontal wheel movement and Shift + vertical wheel
	 * movement. Navigation is throttled to avoid selecting multiple months
	 * from a single wheel gesture.
	 *
	 * @param {WheelEvent} event
	 *        Wheel event from the timeline.
	 */
	#handleWheel(event) {
		const direction = Math.sign(
			event.deltaX || (event.shiftKey ? event.deltaY : 0)
		);

		if (!direction) return;

		event.preventDefault();

		if (this.wheelTimer) return;

		this.wheelDirection = direction;

		const nextIndex = this.selectedIndex + direction;

		this.#selectMonth(nextIndex);

		this.wheelTimer = window.setTimeout(() => {
			this.wheelTimer = null;
			this.wheelDirection = 0;
		}, 180);
	}

	/**
	 * Handles window resize events.
	 *
	 * Recalculates timeline dimensions without retrieving planner data
	 * or rebuilding the rendered activity entries.
	 */
	#handleResize() {
		if (!this.initialized || !this.plannerData) return;

		this.#updateLayout();
	}

	/**
	 * Updates the dimensions of the timeline and its related elements.
	 *
	 * Calculates the required width from the number of displayed months.
	 */
	#updateLayout() {
		if (!this.initialized) return;

		const months = this.#getTimelineMonths();
		const width = months.length * MONTH_WIDTH;

		this.monthRow.style.width = `${width}px`;
		this.timelineGrid.style.width = `${width}px`;
		this.timelineData.style.width = `${width}px`;

		this.monthRow.style.display = "grid";

		this.monthRow.style.gridTemplateColumns =
			`repeat(${months.length}, ${MONTH_WIDTH}px)`;

		this.timelineGrid.style.display = "grid";

		this.timelineGrid.style.gridTemplateColumns =
			`repeat(${months.length}, ${MONTH_WIDTH}px)`;

		this.timelineData
			.querySelectorAll(".timeline-activity-row")
			.forEach(row => {
				row.style.display = "grid";

				row.style.gridTemplateColumns =
					`repeat(${months.length}, ${MONTH_WIDTH}px)`;

				row.style.width = `${width}px`;
			});

		this.timelineData
			.querySelectorAll(".timeline-section-row")
			.forEach(row => {
				row.style.width = `${width}px`;
			});

		this.track.style.setProperty(
			"--content-width",
			`${width}px`
		);
	}

	/**
	 * Generates a safe CSS class suffix from a hobby identifier.
	 *
	 * @param {string} hobbyId
	 *        Hobby identifier.
	 *
	 * @returns {string}
	 *          CSS class suffix.
	 */
	#hobbyClass(hobbyId) {
		return String(hobbyId)
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "-");
	}
}