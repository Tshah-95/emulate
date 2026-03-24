import type { RouteContext } from "@internal/core";
import { getAwsStore } from "../store.js";
import { awsXmlResponse, awsErrorXml, generateAwsId, generateMessageId, getAccountId, parseQueryString } from "../helpers.js";
import { randomBytes } from "crypto";

export function iamRoutes(ctx: RouteContext): void {
  const { app, store } = ctx;
  const aws = () => getAwsStore(store);
  const accountId = getAccountId();

  // IAM actions via POST with Action parameter
  app.post("/iam/", async (c) => {
    const body = await c.req.text();
    const params = parseQueryString(body);
    const action = params["Action"] ?? c.req.query("Action") ?? "";

    switch (action) {
      case "CreateUser":
        return createUser(c, params);
      case "GetUser":
        return getUser(c, params);
      case "DeleteUser":
        return deleteUser(c, params);
      case "ListUsers":
        return listUsers(c);
      case "CreateAccessKey":
        return createAccessKey(c, params);
      case "ListAccessKeys":
        return listAccessKeys(c, params);
      case "DeleteAccessKey":
        return deleteAccessKey(c, params);
      case "CreateRole":
        return createRole(c, params);
      case "GetRole":
        return getRole(c, params);
      case "DeleteRole":
        return deleteRole(c, params);
      case "ListRoles":
        return listRoles(c);
      default:
        return awsErrorXml(c, "InvalidAction", `The action ${action} is not valid for this endpoint.`, 400);
    }
  });

  // STS endpoints
  app.post("/sts/", async (c) => {
    const body = await c.req.text();
    const params = parseQueryString(body);
    const action = params["Action"] ?? c.req.query("Action") ?? "";

    switch (action) {
      case "GetCallerIdentity":
        return getCallerIdentity(c);
      case "AssumeRole":
        return assumeRole(c, params);
      default:
        return awsErrorXml(c, "InvalidAction", `The action ${action} is not valid for this endpoint.`, 400);
    }
  });

  function createUser(c: any, params: Record<string, string>) {
    const userName = params["UserName"] ?? "";
    if (!userName) {
      return awsErrorXml(c, "ValidationError", "The request must contain the parameter UserName.", 400);
    }

    const existing = aws().iamUsers.findOneBy("user_name", userName);
    if (existing) {
      return awsErrorXml(c, "EntityAlreadyExists", `User with name ${userName} already exists.`, 409);
    }

    const userId = generateAwsId("AIDA");
    const path = params["Path"] ?? "/";
    const arn = `arn:aws:iam::${accountId}:user${path}${userName}`;

    aws().iamUsers.insert({
      user_name: userName,
      user_id: userId,
      arn,
      path,
      access_keys: [],
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CreateUserResponse>
  <CreateUserResult>
    <User>
      <Path>${path}</Path>
      <UserName>${userName}</UserName>
      <UserId>${userId}</UserId>
      <Arn>${arn}</Arn>
      <CreateDate>${new Date().toISOString()}</CreateDate>
    </User>
  </CreateUserResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</CreateUserResponse>`;
    return awsXmlResponse(c, xml);
  }

  function getUser(c: any, params: Record<string, string>) {
    const userName = params["UserName"] ?? "";
    const user = aws().iamUsers.findOneBy("user_name", userName);
    if (!user) {
      return awsErrorXml(c, "NoSuchEntity", `The user with name ${userName} cannot be found.`, 404);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<GetUserResponse>
  <GetUserResult>
    <User>
      <Path>${user.path}</Path>
      <UserName>${user.user_name}</UserName>
      <UserId>${user.user_id}</UserId>
      <Arn>${user.arn}</Arn>
      <CreateDate>${user.created_at}</CreateDate>
    </User>
  </GetUserResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</GetUserResponse>`;
    return awsXmlResponse(c, xml);
  }

  function deleteUser(c: any, params: Record<string, string>) {
    const userName = params["UserName"] ?? "";
    const user = aws().iamUsers.findOneBy("user_name", userName);
    if (!user) {
      return awsErrorXml(c, "NoSuchEntity", `The user with name ${userName} cannot be found.`, 404);
    }

    aws().iamUsers.delete(user.id);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DeleteUserResponse>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</DeleteUserResponse>`;
    return awsXmlResponse(c, xml);
  }

  function listUsers(c: any) {
    const users = aws().iamUsers.all();
    const usersXml = users
      .map(
        (u) => `      <member>
        <Path>${u.path}</Path>
        <UserName>${u.user_name}</UserName>
        <UserId>${u.user_id}</UserId>
        <Arn>${u.arn}</Arn>
        <CreateDate>${u.created_at}</CreateDate>
      </member>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListUsersResponse>
  <ListUsersResult>
    <IsTruncated>false</IsTruncated>
    <Users>
${usersXml}
    </Users>
  </ListUsersResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</ListUsersResponse>`;
    return awsXmlResponse(c, xml);
  }

  function createAccessKey(c: any, params: Record<string, string>) {
    const userName = params["UserName"] ?? "";
    const user = aws().iamUsers.findOneBy("user_name", userName);
    if (!user) {
      return awsErrorXml(c, "NoSuchEntity", `The user with name ${userName} cannot be found.`, 404);
    }

    const accessKeyId = "AKIA" + randomBytes(8).toString("hex").toUpperCase();
    const secretAccessKey = randomBytes(30).toString("base64");

    const keys = [...user.access_keys, { access_key_id: accessKeyId, secret_access_key: secretAccessKey, status: "Active" as const }];
    aws().iamUsers.update(user.id, { access_keys: keys });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CreateAccessKeyResponse>
  <CreateAccessKeyResult>
    <AccessKey>
      <UserName>${userName}</UserName>
      <AccessKeyId>${accessKeyId}</AccessKeyId>
      <Status>Active</Status>
      <SecretAccessKey>${secretAccessKey}</SecretAccessKey>
      <CreateDate>${new Date().toISOString()}</CreateDate>
    </AccessKey>
  </CreateAccessKeyResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</CreateAccessKeyResponse>`;
    return awsXmlResponse(c, xml);
  }

  function listAccessKeys(c: any, params: Record<string, string>) {
    const userName = params["UserName"] ?? "";
    const user = aws().iamUsers.findOneBy("user_name", userName);
    if (!user) {
      return awsErrorXml(c, "NoSuchEntity", `The user with name ${userName} cannot be found.`, 404);
    }

    const keysXml = user.access_keys
      .map(
        (k) => `      <member>
        <UserName>${userName}</UserName>
        <AccessKeyId>${k.access_key_id}</AccessKeyId>
        <Status>${k.status}</Status>
      </member>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListAccessKeysResponse>
  <ListAccessKeysResult>
    <IsTruncated>false</IsTruncated>
    <AccessKeyMetadata>
${keysXml}
    </AccessKeyMetadata>
  </ListAccessKeysResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</ListAccessKeysResponse>`;
    return awsXmlResponse(c, xml);
  }

  function deleteAccessKey(c: any, params: Record<string, string>) {
    const userName = params["UserName"] ?? "";
    const accessKeyId = params["AccessKeyId"] ?? "";
    const user = aws().iamUsers.findOneBy("user_name", userName);
    if (!user) {
      return awsErrorXml(c, "NoSuchEntity", `The user with name ${userName} cannot be found.`, 404);
    }

    const keys = user.access_keys.filter((k) => k.access_key_id !== accessKeyId);
    aws().iamUsers.update(user.id, { access_keys: keys });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DeleteAccessKeyResponse>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</DeleteAccessKeyResponse>`;
    return awsXmlResponse(c, xml);
  }

  function createRole(c: any, params: Record<string, string>) {
    const roleName = params["RoleName"] ?? "";
    if (!roleName) {
      return awsErrorXml(c, "ValidationError", "The request must contain the parameter RoleName.", 400);
    }

    const existing = aws().iamRoles.findOneBy("role_name", roleName);
    if (existing) {
      return awsErrorXml(c, "EntityAlreadyExists", `Role with name ${roleName} already exists.`, 409);
    }

    const roleId = generateAwsId("AROA");
    const path = params["Path"] ?? "/";
    const arn = `arn:aws:iam::${accountId}:role${path}${roleName}`;
    const assumeRolePolicy = params["AssumeRolePolicyDocument"] ?? "{}";
    const description = params["Description"] ?? "";

    aws().iamRoles.insert({
      role_name: roleName,
      role_id: roleId,
      arn,
      path,
      assume_role_policy_document: assumeRolePolicy,
      description,
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CreateRoleResponse>
  <CreateRoleResult>
    <Role>
      <Path>${path}</Path>
      <RoleName>${roleName}</RoleName>
      <RoleId>${roleId}</RoleId>
      <Arn>${arn}</Arn>
      <CreateDate>${new Date().toISOString()}</CreateDate>
      <AssumeRolePolicyDocument>${encodeURIComponent(assumeRolePolicy)}</AssumeRolePolicyDocument>
      <Description>${description}</Description>
    </Role>
  </CreateRoleResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</CreateRoleResponse>`;
    return awsXmlResponse(c, xml);
  }

  function getRole(c: any, params: Record<string, string>) {
    const roleName = params["RoleName"] ?? "";
    const role = aws().iamRoles.findOneBy("role_name", roleName);
    if (!role) {
      return awsErrorXml(c, "NoSuchEntity", `The role with name ${roleName} cannot be found.`, 404);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<GetRoleResponse>
  <GetRoleResult>
    <Role>
      <Path>${role.path}</Path>
      <RoleName>${role.role_name}</RoleName>
      <RoleId>${role.role_id}</RoleId>
      <Arn>${role.arn}</Arn>
      <CreateDate>${role.created_at}</CreateDate>
      <AssumeRolePolicyDocument>${encodeURIComponent(role.assume_role_policy_document)}</AssumeRolePolicyDocument>
      <Description>${role.description}</Description>
    </Role>
  </GetRoleResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</GetRoleResponse>`;
    return awsXmlResponse(c, xml);
  }

  function deleteRole(c: any, params: Record<string, string>) {
    const roleName = params["RoleName"] ?? "";
    const role = aws().iamRoles.findOneBy("role_name", roleName);
    if (!role) {
      return awsErrorXml(c, "NoSuchEntity", `The role with name ${roleName} cannot be found.`, 404);
    }

    aws().iamRoles.delete(role.id);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DeleteRoleResponse>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</DeleteRoleResponse>`;
    return awsXmlResponse(c, xml);
  }

  function listRoles(c: any) {
    const roles = aws().iamRoles.all();
    const rolesXml = roles
      .map(
        (r) => `      <member>
        <Path>${r.path}</Path>
        <RoleName>${r.role_name}</RoleName>
        <RoleId>${r.role_id}</RoleId>
        <Arn>${r.arn}</Arn>
        <CreateDate>${r.created_at}</CreateDate>
        <Description>${r.description}</Description>
      </member>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListRolesResponse>
  <ListRolesResult>
    <IsTruncated>false</IsTruncated>
    <Roles>
${rolesXml}
    </Roles>
  </ListRolesResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</ListRolesResponse>`;
    return awsXmlResponse(c, xml);
  }

  function getCallerIdentity(c: any) {
    const authUser = c.get("authUser");
    const userName = authUser?.login ?? "admin";
    const arn = `arn:aws:iam::${accountId}:user/${userName}`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<GetCallerIdentityResponse>
  <GetCallerIdentityResult>
    <Arn>${arn}</Arn>
    <UserId>${generateAwsId("AIDA")}</UserId>
    <Account>${accountId}</Account>
  </GetCallerIdentityResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</GetCallerIdentityResponse>`;
    return awsXmlResponse(c, xml);
  }

  function assumeRole(c: any, params: Record<string, string>) {
    const roleArn = params["RoleArn"] ?? "";
    const sessionName = params["RoleSessionName"] ?? "session";

    // Find the role by ARN
    const role = aws().iamRoles.all().find((r) => r.arn === roleArn);
    if (!role) {
      return awsErrorXml(c, "NoSuchEntity", `The role specified cannot be found.`, 404);
    }

    const accessKeyId = "ASIA" + randomBytes(8).toString("hex").toUpperCase();
    const secretAccessKey = randomBytes(30).toString("base64");
    const sessionToken = randomBytes(64).toString("base64");
    const expiration = new Date(Date.now() + 3600 * 1000).toISOString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AssumeRoleResponse>
  <AssumeRoleResult>
    <Credentials>
      <AccessKeyId>${accessKeyId}</AccessKeyId>
      <SecretAccessKey>${secretAccessKey}</SecretAccessKey>
      <SessionToken>${sessionToken}</SessionToken>
      <Expiration>${expiration}</Expiration>
    </Credentials>
    <AssumedRoleUser>
      <Arn>${roleArn}/${sessionName}</Arn>
      <AssumedRoleId>${role.role_id}:${sessionName}</AssumedRoleId>
    </AssumedRoleUser>
  </AssumeRoleResult>
  <ResponseMetadata><RequestId>${generateMessageId()}</RequestId></ResponseMetadata>
</AssumeRoleResponse>`;
    return awsXmlResponse(c, xml);
  }
}
