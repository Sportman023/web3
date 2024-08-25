export function toUrlSafe(str: string) {
  let safeStr = str;

  while (safeStr.indexOf("/") >= 0) {
    safeStr = safeStr.replace("/", "_");
  }
  while (safeStr.indexOf("+") >= 0) {
    safeStr = safeStr.replace("+", "-");
  }
  while (safeStr.indexOf("=") >= 0) {
    safeStr = safeStr.replace("=", "");
  }

  return safeStr;
}