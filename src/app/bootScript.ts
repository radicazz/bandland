/**
 * Runs before first paint. `js` lets CSS hide reveal targets only once script is
 * available (no-JS visitors see everything); `intro-seen` skips the stage intro
 * after the first load of a session.
 */
export const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");try{if(sessionStorage.getItem("bandland-intro")==="1")d.classList.add("intro-seen")}catch(e){}})();`;
