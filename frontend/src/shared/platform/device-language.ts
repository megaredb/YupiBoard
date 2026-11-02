/** Preferred UI languages of the browser or Android WebView, most preferred first. */
export function getDeviceLanguages(): readonly string[] {
  return navigator.languages.length > 0 ? navigator.languages : [navigator.language]
}
