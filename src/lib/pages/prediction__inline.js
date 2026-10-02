
;



;



;



;

document.addEventListener(
      "DOMContentLoaded",
      function () {

        const stickers =
          document.querySelectorAll(
            "tgs-player.pred-sticker"
          );


        stickers.forEach(
          function (sticker) {

            sticker.addEventListener(
              "error",
              function () {

                console.warn(
                  "Telegram TGS sticker failed:",
                  sticker.getAttribute("src")
                );

              }
            );

          }
        );

      }
    );

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


