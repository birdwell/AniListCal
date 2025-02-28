// graphql.d.ts
declare module "*.graphql" {
  import { DocumentNode } from "graphql";
  const value: DocumentNode;
  export default value;
}

declare module "*.graphql?raw" {
  const content: string;
  export default content;
}
