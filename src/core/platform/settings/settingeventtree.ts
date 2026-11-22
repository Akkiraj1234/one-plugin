/**
 * Represents a callback registered against a setting path.
 *
 * A listener receives the updated value associated with the setting
 * whenever the corresponding event is dispatched.
 *
 * Multiple listeners can be registered against the same path.
 * The same function reference cannot be registered more than once
 * because listeners are stored using a Set.
 *
 * @param value The value associated with the setting event.
 */
type SettingListener = (value: unknown) => void;


/**
 * Represents a single node in the SettingEventTree's Trie structure.
 *
 * Each node represents one segment of a setting path. For example,
 * the path `["settings", "theme", "color"]` is represented by three
 * connected nodes:
 *
 * ```md
 * root
 *  └── settings
 *       └── theme
 *            └── color
 * ```
 * Every node maintains its own collection of listeners and a Map
 * containing its child nodes.
 *
 * The Trie is constructed dynamically. A node is created only when
 * a path segment is first encountered.
 *
 * @internal
 */
class TrieNode {
    readonly pathname: string;
    readonly next: Map<string, TrieNode>;
    readonly listners: Set<SettingListener>;

    constructor(pathname: string) {
        this.pathname = pathname;
        this.listners = new Set();
        this.next = new Map();
    }
}


/**
 * Manages setting listeners using a dynamically constructed Trie.
 *
 * Provides methods to register, retrieve, and remove listeners
 * associated with setting paths.
 *
 * Paths are represented as arrays of strings, where each string
 * represents one segment of the path.
 *
 * For example:
 *
 * `["settings", "theme", "color"]`
 *
 * represents `settings.theme.color`.
 *
 * Listener retrieval supports two modes:
 *
 * - Exact matching: retrieves listeners registered at the requested path.
 * - Parent matching: retrieves listeners registered at matching parent
 *   paths and the requested path.
 *
 * The Trie is built dynamically as paths are registered or added.
 * Removing listeners does not necessarily remove their Trie nodes.
 */
class settingEventTree {
    private trie: TrieNode;

    /**
     * Creates a new SettingEventTree instance.
     *
     * Initializes an empty Trie with a single root node.
     * Additional nodes are created dynamically when paths are
     * registered or explicitly added.
     */
    constructor() {
        this.trie = new TrieNode("root");
    }

    /**
     * Registers a listener against the specified setting path.
     *
     * Missing path segments are created automatically.
     * Duplicate registrations of the same function reference are ignored.
     *
     * @param path Setting path represented as an array of segments.
     * @param caller Listener callback to register.
     */
    append(path: readonly string[], caller: SettingListener): void {
        const node = this.add_tree(path);
        node.listners.add(caller);
    }

    /**
     * Retrieves listeners registered along the specified setting path.
     *
     * When parent is true, listeners from matching parent paths and
     * the exact path are included.
     * Otherwise, only listeners registered at the exact path are returned.
     *
     * The returned Map uses the matched setting paths as keys and their
     * corresponding listener sets as values.
     *
     * If traversal encounters a missing path segment, previously
     * collected parent listeners are preserved when parent is true.
     *
     * @param paths Setting path to search.
     * @param parent Whether to include matching parent path listeners.
     * @returns Map of matched paths to their registered listener sets.
     */
    get(paths: readonly string[], parent: boolean = true): Map<string, Set<SettingListener>> {
        const callers = new Map<string, Set<SettingListener>>();
        let curr = this.trie;
        let currentpath = "";

        for (const path of paths) {
            const next = curr.next.get(path);
            if (!next) {
                return parent
                    ? callers
                    : new Map<string, Set<SettingListener>>();
            }

            curr = next;
            currentpath = currentpath
                ? `${currentpath}.${path}`
                : path;

            if (parent && curr.listners.size > 0) {
                callers.set(currentpath, curr.listners);
            }
        }

        if (!parent && curr.listners.size > 0) {
            callers.set(currentpath, curr.listners);
        }

        return callers;
    }

    /**
     * Removes listeners from a specific path or the entire Trie.
     *
     * If path is null, the operation is applied recursively to every node.
     * Otherwise, only listeners registered at the exact specified path
     * are affected.
     *
     * If callable is null, all listeners at the selected location are
     * removed. Otherwise, only the specified callback is removed.
     *
     * Trie nodes are preserved. Use remove_tree() to remove paths.
     *
     * @param callable Listener to remove, or null to remove all listeners.
     * @param path Target setting path, or null to search the entire Trie.
     */
    pop(
        callable: SettingListener | null = null,
        path: readonly string[] | null = null
    ): void {
        if (path === null) {
            this.pop_by_Caller(this.trie, callable);
            return;
        }

        const callers = this.get(path, false);

        for (const listener of callers.values()) {
            if (callable === null) {
                listener.clear();
            } else {
                listener.delete(callable);
            }
        }
    }

    /**
     * Adds a path to the Trie, creating any missing nodes.
     *
     * Existing nodes are reused during traversal.
     *
     * @param paths Path segments to add.
     * @returns The final node of the added path.
     */
    add_tree(paths: readonly string[]): TrieNode {
        let curr = this.trie;

        for (const path of paths) {
            let next = curr.next.get(path);

            if (!next) {
                next = new TrieNode(path);
                curr.next.set(path, next);
            }

            curr = next;
        }

        return curr;
    }

    /**
     * Removes a path from the Trie.
     *
     * When removeChild is true, the target node and its entire
     * subtree are removed.
     *
     * When false, the target node is preserved if it has children,
     * but its listeners are cleared. If it has no children, the
     * target node is removed.
     *
     * @param paths Path segments identifying the target node.
     * @param removeChild Whether to remove the target's entire subtree.
     */
    remove_tree(paths: readonly string[], removeChild = true): void {
        let curr = this.trie;

        if (paths.length === 0) return;

        for (let i = 0; i < paths.length - 1; i++) {
            const path = paths[i];
            if (path === undefined) return;
            const next = curr.next.get(path);
            if (!next) return;
            curr = next;
        }

        const target = paths[paths.length - 1];
        if (target === undefined) return;
        const node = curr.next.get(target);
        if (!node) return;

        if (node.next.size > 0 && !removeChild) {
            node.listners.clear();
        } else {
            curr.next.delete(target);
        }
    }

    /**
     * Recursively removes listeners from a node and its descendants.
     *
     * If caller is null, all listeners in the subtree are cleared.
     * Otherwise, only the specified callback is removed.
     *
     * The Trie structure remains unchanged.
     *
     * @param trie Node from which recursive removal begins.
     * @param caller Listener to remove, or null to clear all listeners.
     */
    private pop_by_Caller(trie: TrieNode, caller: SettingListener | null): void {
        if (caller === null) {
            trie.listners.clear();
        } else {
            trie.listners.delete(caller);
        }

        for (const node of trie.next.values()) {
            this.pop_by_Caller(node, caller);
        }
    }
}

export {
    settingEventTree,
    TrieNode,
    type SettingListener
}
