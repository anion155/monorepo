import { TsCompilerInstance } from "ts-jest";
import { SourceFile, TransformationContext, Transformer, Visitor } from "typescript";

export const version = 1;
export const name = "expose-private-fields";

export function factory(compilerInstance: TsCompilerInstance) {
  const ts = compilerInstance.configSet.compilerModule;
  return (ctx: TransformationContext): Transformer<SourceFile> => {
    const visitor: Visitor = (node) => {
      if (ts.isPrivateIdentifier(node)) {
        const name = node.text.replace(/^#/, "");
        return ts.factory.createIdentifier(`_private_${name}`);
      }
      return ts.visitEachChild(node, visitor, ctx);
    };
    return (sf: SourceFile) => ts.visitNode(sf, visitor) as never;
  };
}
