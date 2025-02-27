/**
 * Here the id of the document is directly set in the attribute
 * of the document, not in the relationships attribute
 */
export default class HasOneInPlace extends Association {
    /**
     * @returns {QueryState | QueryDefinition}
     */
    static query(doc: any, client: any, assoc: any): QueryState | QueryDefinition;
    constructor(target: any, name: string, doctype: string, options: {
        get: Function;
        query: Function;
        mutate: Function;
        save: Function;
        dispatch: Function;
    });
    dehydrate(doc: any): any;
}
export const BelongsToInPlace: typeof HasOneInPlace;
import Association from "./Association";
import { QueryState } from "../types";
import { QueryDefinition } from "../queries/dsl";
