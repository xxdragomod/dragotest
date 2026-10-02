
;



;



;



;

(function(){
    document.addEventListener("contextmenu", function(e){
      if (e.target && (e.target.tagName === "IMG" || e.target.closest("img"))) {
        e.preventDefault();
      }
    }, true);
    document.addEventListener("dragstart", function(e){
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    }, true);
  })();

;


