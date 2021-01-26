import Association from './Association'
import { Q } from '../queries/dsl'
/**
 * Here the id of the document is directly set in the attribute
 * of the document, not in the relationships attribute
 */
export default class HasOneInPlace extends Association {
  get raw() {
    return this.target[this.name]
  }

  get data() {
    return Q(this.doctype).getById(this.raw)
  }

  static query(doc, client, assoc) {
    const id = doc[assoc.name]
    return (
      client.getDocumentFromState(assoc.doctype, id) ||
      client.get(assoc.doctype, id)
    )
  }

  dehydrate(doc) {
    return {
      ...doc,
      [this.name]: this.raw || undefined
    }
  }
}

export const BelongsToInPlace = HasOneInPlace
