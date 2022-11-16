const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204, 
  MOVED_PERMANENTLY: 301,
  FOUND: 302, 
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};
Object.freeze(HTTP_STATUS);

export {HTTP_STATUS};