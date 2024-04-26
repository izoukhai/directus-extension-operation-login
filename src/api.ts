import { defineOperationApi } from "@directus/extensions-sdk";
import { Action } from "@directus/constants";
import {
  InvalidPayloadError,
  createError,
  ServiceUnavailableError,
} from "@directus/errors";
import { nanoid } from "nanoid";
import ms from "ms";
import jwt from "jsonwebtoken";

type Options = {
  user_id: string;
};

export default defineOperationApi<Options>({
  id: "operation-login",
  handler: async (
    { user_id },
    { database, env, getSchema, services, accountability }
  ) => {
    try {
      if (!user_id) throw new Error("Missing user ID");

      const user: any = await database
        .select<any & { tfa_secret: string | null }>(
          "u.id",
          "u.first_name",
          "u.last_name",
          "u.email",
          "u.password",
          "u.status",
          "u.role",
          "r.admin_access",
          "r.app_access",
          "u.tfa_secret",
          "u.provider",
          "u.external_identifier",
          "u.auth_data"
        )
        .from("directus_users as u")
        .leftJoin("directus_roles as r", "u.role", "r.id")
        .where("u.id", user_id)
        .first();

      if (!user) {
        throw new Error("User not found");
      }

      if (user?.status !== "active") {
        if (user?.status === "suspended") throw new Error("User is suspended");
        else throw new Error("Invalid user status");
      }

      const tokenPayload = {
        id: user.id,
        role: user.role,
        app_access: user.app_access,
        admin_access: user.admin_access,
      };

      const refreshToken = nanoid(64);
      const refreshTokenExpiration = new Date(
        Date.now() + ms(env["REFRESH_TOKEN_TTL"])
      );

      const TTL = env["ACCESS_TOKEN_TTL"] as string;

      const accessToken = jwt.sign(tokenPayload, env["SECRET"] as string, {
        expiresIn: ms(TTL),
        issuer: "directus",
      });

      await database("directus_sessions").insert({
        token: refreshToken,
        user: user.id,
        expires: refreshTokenExpiration,
        ip: accountability?.ip,
        user_agent: accountability?.userAgent,
        origin: accountability?.origin,
      });

      await database("directus_sessions")
        .delete()
        .where("expires", "<", new Date());

      if (accountability) {
        await database("directus_activity").insert({
          action: Action.LOGIN,
          user: user.id,
          ip: accountability?.ip,
          user_agent: accountability?.userAgent,
          origin: accountability?.origin,
          collection: "directus_users",
          item: user.id,
        });
      }

      await database("directus_users")
        .update({ last_access: new Date() })
        .where({ id: user.id });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires: ms(TTL),
        id: user.id,
      };
    } catch (e: any) {
      return new ServiceUnavailableError({
        service: "Login Operation",
        reason: e?.message || "Could not login user",
      });
    }
  },
});
