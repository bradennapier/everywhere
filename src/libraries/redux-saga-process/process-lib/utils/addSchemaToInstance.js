/*
  Merge Public and Private Schemas into a property on
  the given instance.
 */
export default function addProcessSchematoInstance(instance, schema) {
  const { compiled } = schema;
  if (compiled && compiled.public) {
    for (const key of Object.keys(compiled.public)) {
      instance[key] = { ...compiled.public[key] };
    }
  }
  if (compiled && compiled.private) {
    for (const key of Object.keys(compiled.private)) {
      instance[key] = {
        ...instance[key],
        ...compiled.private[key],
      };
    }
  }
}
