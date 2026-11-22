# Architecture Decision Records

Use this folder to document decisions that affect the system structure, data formats, dependencies, or long-term compatibility. Routine implementation details should be documented in code comments or the relevant developer guide.

Each decision should be documented in a numbered or dated Markdown file (for example, `0001-application-styling-and-css-build.md`). Please follow the [ADR Documentation Guide](#guide) when creating a new record.

## Important ADRs

The following ADRs document important decisions that contributors should read and understand:

- [ADR 0001: Application Styling and CSS Build Strategy](./0001-application-styling-and-css-build.md)
- [ADR 0002: Settings State and Change Notifications](./0002-settings-state-and-change-notifications.md)

## Guide

Every ADR must begin with the following information:

- **Author:** The person who proposed or documented the decision.
- **Status:** The current status of the decision (e.g. Proposed, Accepted, Deprecated, Superseded).
- **Date:** The date the decision was recorded.
- **Decision:** A short, clear statement describing the chosen approach.

After the header, use the following sections to structure the ADR:

- **Overview:** A brief explanation of what the decision is and what it establishes.
- **Table of Contents:** Links to the main sections for easier navigation.
- **Context:** The problem being addressed and the relevant constraints.
- **Decision:** The chosen approach and its implementation details.
- **Alternatives Considered:** The main options considered and why they were not selected.
- **Consequences:** The trade-offs, implications, and any follow-up work resulting from the decision.

Keep ADRs concise and easy to understand. Where relevant, include links to affected source files or related ADRs.
