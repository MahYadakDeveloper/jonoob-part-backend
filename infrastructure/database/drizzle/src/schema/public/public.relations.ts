import { defineRelationsPart } from 'drizzle-orm';
import * as schemas from './tables';

export const publicRelations = defineRelationsPart(schemas, (r) => ({
  merchandiseLine: {
    items: r.many.merchandiseLine({
      from: r.merchandiseLine.id,
      to: r.merchandiseLine.bundleId,
      where: {
        kind: 'leaf',
      },
    }),
    bundle: r.one.merchandiseLine({
      from: r.merchandiseLine.bundleId,
      to: r.merchandiseLine.id,
      where: {
        kind: 'bundle',
      },
    }),
  },
}));
