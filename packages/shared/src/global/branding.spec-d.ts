import "./branding";

import { Equal, Expect, ExpectNot, Extends } from "../type-tests";

type SomeId = Branded<string, "some-id", "meta">;
type NestedId = Branded<SomeId, "nested-id", 55>;

type Cases = [
  // should not be equal to original type
  ExpectNot<Equal<NestedId, string>>,
  // should extend original type
  Expect<Extends<NestedId, string>>,

  // should be able to get meta and type back
  Expect<Equal<BrandMeta<NestedId, "some-id">, "meta">>,
  Expect<Equal<BrandMeta<NestedId, "nested-id">, 55>>,
  Expect<Equal<BrandType<NestedId>, string>>
];
