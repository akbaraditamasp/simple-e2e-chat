import vine, { errors } from "@vinejs/vine";
import { ConstructableSchema } from "@vinejs/vine/types";

vine.convertEmptyStringsToNull = true;

export default function validation<T = any, Y = any, Z = any>(
  schema: ConstructableSchema<T, Y, Z>,
  onSubmit: (data: Awaited<Y>) => void,
  additionalData?: Record<string, any>,
) {
  return () => ({
    data: {} as T,
    errors: {} as Record<keyof T, string>,
    async submit() {
      try {
        const validatedData = await vine.validate({ schema, data: this.data });

        await onSubmit(validatedData);
      } catch (e) {
        if (e instanceof errors.E_VALIDATION_ERROR) {
          for (const error of e.messages) {
            this.errors[error.field as keyof T] = error.message;
          }
        } else {
          throw e;
        }
      }
    },
    ...additionalData,
  });
}
