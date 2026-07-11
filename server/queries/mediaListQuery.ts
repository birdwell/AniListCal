/**
 * Canonical media list query shared with the client. The proxy cache key is a
 * hash of the exact query text, so the prefetch and client requests must send
 * byte-identical strings — never fork this definition.
 */
export {
  GET_USER_MEDIA_LIST_QUERY,
  PREFETCH_LIST_STATUS_SETS,
} from "../../shared/queries/mediaList";
