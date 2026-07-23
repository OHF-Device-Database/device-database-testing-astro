import type { DimensionCategory } from "./api-client";

// Helpers over the category tree the dimensions endpoint returns. Two facts about
// the API shape everything here (verified against the live endpoint):
//
// - A tree node's count is a hierarchical rollup: a parent's count includes all of
//   its descendants ("cleaning" reports 127 even though every device is tagged
//   "vacuum").
// - The devices endpoint matches direct tags only: ?category=cleaning returns 0.
//   Filtering by a top-level category therefore has to send the id plus all of its
//   descendant ids, and the result size then equals the rollup count.

type CategoryTree = Record<string, DimensionCategory>;

function walk(
    tree: CategoryTree,
    visit: (id: string, node: DimensionCategory, topId: string) => void,
    topId?: string,
): void {
    for (const [id, node] of Object.entries(tree)) {
        const top = topId ?? id;
        visit(id, node, top);
        walk(node.children, visit, top);
    }
}

/** Top-level category id -> that id plus every descendant id, for filter queries. */
export function categoryQueryIds(tree: CategoryTree): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    walk(tree, (id, _node, top) => {
        (out[top] ??= []).push(id);
    });
    return out;
}

/** Any category id -> the id of its top-level ancestor (itself when top-level). */
export function topLevelCategory(tree: CategoryTree): Record<string, string> {
    const out: Record<string, string> = {};
    walk(tree, (id, _node, top) => {
        out[id] = top;
    });
    return out;
}

/** Top-level category id -> total devices in that category (the rollup count). */
export function topLevelCategoryCounts(tree: CategoryTree): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [id, node] of Object.entries(tree)) {
        out[id] = node.count;
    }
    return out;
}
