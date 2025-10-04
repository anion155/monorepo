import { appendMethod, isDisposable } from "@anion155/shared";
import type { ForwardedRef } from "react";
import { useEffect, useImperativeHandle } from "react";

import { createEntityComponent } from "./entity";

const ResourceEntityComponent = createEntityComponent("Resource", <Resource,>(useResource: () => Resource) => {
  const resource = useResource();
  useEffect(() => {
    if (!isDisposable(resource)) return;
    return () => resource[Symbol.dispose]();
  }, [resource]);
  return resource;
});
appendMethod(ResourceEntityComponent, "createResource", <Resource,>(useResource: () => Resource, name?: string) => {
  const Resource = ({ ref }: { ref?: ForwardedRef<Resource> }) => {
    const resource = ResourceEntityComponent.useRegister(useResource);
    useImperativeHandle(ref, () => resource, [resource]);
    return null;
  };
  if (name) Object.defineProperty(Resource, "name", { value: name, writable: false, enumerable: true, configurable: true });
  return Resource;
});
const _ResourceEntityComponent = ResourceEntityComponent;
export { _ResourceEntityComponent as ResourceEntityComponent };
