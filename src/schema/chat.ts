import { RxJsonSchema } from "rxdb";

const conversationSchema = {
  version: 0,
  primaryKey: "cuid",
  type: "object",
  properties: {
    cuid: {
      type: "string",
      maxLength: 100,
    },
    conversationInfo: {
      type: "object",
    },
    chats: {
      type: "array",
    },
  },
  required: ["cuid", "conversationInfo", "chats"],
} as RxJsonSchema<{
  cuid: string;
  conversationInfo: {
    cuid: string;
    displayName: string;
  };
  chats: {
    sender: {
      cuid: string;
      displayName: string;
    };
    text: string;
  }[];
}>;

export default conversationSchema;
