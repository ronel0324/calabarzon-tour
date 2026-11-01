// utils/panoramaHtml.js
// Ginagamit ng PanoramaViewer.js (phone, WebView) at PanoramaViewer.web.js (browser, iframe).

export const buildPanoramaHtml = ({ panoramaImage, hotspots = [], initialRotation = 0 }) => {
  // hotspot_x / hotspot_y (0 to 1) -> yaw / pitch
  const spots = hotspots.map((h, i) => ({
    index: i,
    yaw: (h.hotspot_x - 0.5) * 360,
    pitch: (0.5 - h.hotspot_y) * 180,
    label: h.label || h.to_point_name || '',
  }));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.js"></script>
  <style>
    html, body, #pano { margin:0; width:100%; height:100%; background:#000; overflow:hidden; }
    .hs {
      width:45px; height:45px; border-radius:50%;
      background:rgba(255,68,68,.95); border:3px solid #fff;
      color:#fff; font-size:24px; font-weight:bold;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 4px rgba(0,0,0,.5);
    }
    .hs-label {
      position:absolute; top:50px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,.8); color:#fff; font:600 11px sans-serif;
      padding:4px 8px; border-radius:4px; white-space:nowrap;
    }
    .ihs {
      width:34px; height:34px; border-radius:50%;
      background:rgba(255,255,255,.85); border:3px solid #4a6fa5;
      color:#4a6fa5; font:bold 20px Georgia, serif;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 5px rgba(0,0,0,.5);
    }
    .ihs.draft {
      border:3px dashed #2e7d32; color:#2e7d32; background:rgba(255,255,255,.95);
    }
  </style>
</head>
<body>
  <div id="pano"></div>
  <script>
    var spots = ${JSON.stringify(spots)};
    var state = { spots: [], editMode: false, draft: null };
    var ready = false;
    var appliedIds = [];

    // Phone: ReactNativeWebView. Web: iframe -> parent window.
    function send(msg) {
      var s = JSON.stringify(msg);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(s);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(s, '*');
      }
    }

    var viewer = pannellum.viewer('pano', {
      type: 'equirectangular',
      panorama: ${JSON.stringify(panoramaImage)},
      autoLoad: true,
      yaw: ${Number(initialRotation) || 0},
      showControls: false,
      hfov: 100,
      hotSpots: spots.map(function (s) {
        return {
          yaw: s.yaw,
          pitch: s.pitch,
          type: 'custom',
          createTooltipFunc: function (div) {
            div.classList.add('hs');
            div.innerHTML = '➜';
            if (s.label) {
              var l = document.createElement('div');
              l.className = 'hs-label';
              l.textContent = s.label;
              div.appendChild(l);
            }
          },
          clickHandlerFunc: function () {
            send({ type: 'hotspot', index: s.index });
          }
        };
      })
    });

    function makeInfoSpot(id, yaw, pitch, isDraft) {
      return {
        id: id,
        yaw: yaw,
        pitch: pitch,
        type: 'custom',
        createTooltipFunc: function (div) {
          div.classList.add('ihs');
          if (isDraft) div.classList.add('draft');
          div.innerHTML = 'i';
        },
        clickHandlerFunc: function () {
          if (!isDraft) send({ type: 'info', id: id });
        }
      };
    }

    function render() {
      appliedIds.forEach(function (id) {
        try { viewer.removeHotSpot(id); } catch (e) {}
      });
      appliedIds = [];

      state.spots.forEach(function (s) {
        viewer.addHotSpot(makeInfoSpot(s.id, s.yaw, s.pitch, false));
        appliedIds.push(s.id);
      });

      if (state.draft) {
        viewer.addHotSpot(makeInfoSpot('__draft__', state.draft.yaw, state.draft.pitch, true));
        appliedIds.push('__draft__');
      }
    }

    // Phone: tinatawag ng injectJavaScript. Web: sa pamamagitan ng message sa ibaba.
    window.applyState = function (json) {
      state = JSON.parse(json);
      if (ready) render();
    };

    window.addEventListener('message', function (e) {
      try {
        var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && d.__panoState) window.applyState(d.__panoState);
      } catch (err) {}
    });

    viewer.on('load', function () {
      ready = true;
      render();
    });

    // Edit mode: tap/click (hindi drag) para pumili ng posisyon
    var pano = document.getElementById('pano');
    var down = null;
    pano.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY, t: Date.now() };
    }, true);
    pano.addEventListener('pointerup', function (e) {
      if (!state.editMode || !down) return;
      var dx = e.clientX - down.x;
      var dy = e.clientY - down.y;
      var quick = (Date.now() - down.t) < 500 && Math.sqrt(dx * dx + dy * dy) < 10;
      down = null;
      if (!quick) return;
      if (e.target && e.target.closest && e.target.closest('.pnlm-hotspot')) return;
      var c = viewer.mouseEventToCoords(e); // [pitch, yaw]
      if (!c) return;
      send({ type: 'place', pitch: c[0], yaw: c[1] });
    }, true);
  </script>
</body>
</html>`;
};
