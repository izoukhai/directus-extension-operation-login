import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "operation-login",
  name: "Login",
  icon: "login",
  description: "Log in an user and send back access & refresh tokens",
  overview: ({ user_id }) => [
    {
      label: "User ID",
      text: user_id,
    },
  ],
  options: [
    {
      field: "user_id",
      name: "User ID",
      type: "string",
      meta: {
        width: "full",
        interface: "string",
      },
    },
  ],
});
