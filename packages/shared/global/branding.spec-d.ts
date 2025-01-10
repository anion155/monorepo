import { Equal, Expect, ExpectNot, Extends } from "../type-tests";
import "./branding";

type SomeId = Branded<string, "some-id", "meta">;
type NestedId = Branded<SomeId, "nested-id", 55>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Tests = [
  Expect<Equal<BrandMeta<NestedId, "some-id">, "meta">>,
  Expect<Equal<BrandMeta<NestedId, "nested-id">, 55>>,
  Expect<Equal<BrandType<NestedId>, string>>,

  ExpectNot<Equal<NestedId, string>>,
  Expect<Extends<NestedId, string>>,
];
