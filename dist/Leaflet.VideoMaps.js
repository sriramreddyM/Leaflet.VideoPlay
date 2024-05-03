(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw ((a.code = "MODULE_NOT_FOUND"), a);
        }
        var p = (n[i] = { exports: {} });
        e[i][0].call(
          p.exports,
          function (r) {
            var n = e[i][1][r];
            return o(n || r);
          },
          p,
          p.exports,
          r,
          e,
          n,
          t
        );
      }
      return n[i].exports;
    }
    for (
      var u = "function" == typeof require && require, i = 0;
      i < t.length;
      i++
    )
      o(t[i]);
    return o;
  }
  return r;
})()(
  {
    1: [
      function (require, module, exports) {
        // L is L
        async function html5video(div_id = "vplayer", video_link) {
          var video = document.createElement("video");
          video.className = "videop";
          video.src = video_link;
          video.type = "video/mp4";
          video.controls = true;
          video.playsinline = true;
          video.height = 190;
          video.width = 320;
          video.muted = true;

          var player = document.getElementById(div_id);
          player.innerHTML = "";
          player.appendChild(video);

          var playPromise = video.play();

          playPromise
            .then((_) => {
              // Automatic playback started!
              // Show playing UI.
              return video;
            })
            .catch((error) => {
              // Auto-play was prevented
              // Show paused UI.
            });
          return video;
        }

        async function YTvideo(div_id = "vplayer", video_id, l, that) {
          var player = document.getElementById(div_id);
          player.innerHTML = "";

          var video = document.createElement("div");
          video.setAttribute("id", "YTvideo");
          video.setAttribute("style", player.getAttribute("style"));
          player.appendChild(video);

          player = new YT.Player("YTvideo", {
            height: "180",
            width: "300",
            videoId: video_id,
            playerVars: {
              playsinline: 1,
              start: Math.floor(l / 1000),
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: that.onPlayerStateChange.bind(that),
            },
          });
          return player;
        }

        function findPosOnTrack(pos, track) {
          var min = 9999999,
            pos_time;
          for (let i = 0; i < track.length - 1; i++) {
            let tpos = L.latLng(track[i][1], track[i][0]);
            let tposd = tpos.distanceTo(pos);
            if (tposd < min) {
              min = tposd;
              pos_time = track[i][2];
            }
          }
          return pos_time;
        }

        function findCTOnTrack(ct, trackords) {
          // let trackords = track.geometry.coordinates;
          let i;
          for (i = 0; i < trackords.length - 1; i++) {
            if (ct * 1000 <= trackords[i][2]) {
              return L.latLng(trackords[i][1], trackords[i][0]);
            }
          }
          return L.latLng(trackords[i][1], trackords[i][0]);
        }

        function youtube_parser(url) {
          var regExp =
            /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
          var match = url.match(regExp);
          return match && match[7].length == 11 ? match[7] : false;
        }

        function onPlayerReady(event) {
          event.target.playVideo();
        }

        var done = false;
        function onPlayerStateChange(event, player) {
          if (event.data == YT.PlayerState.PLAYING && !done) {
            // setTimeout(stopVideo, 6000);
            done = true;
          }
          // playMarker();
        }

        function stopVideo() {
          player.stopVideo();
        }

        L.VideoMaps = L.VectorGrid.extend({
          // constructor function
          initialize: function (lineString, div_id, options) {
            this.lineString = lineString;
            this.selected_track = undefined;
            this.markerPlayer = undefined;
            this.video_eid = div_id;
            L.setOptions(this, options);

            (this.regular_style = {
              stroke: true,
              color: "red",
              weight: 4,
            }),
              (this.mouseover_style = {
                stroke: true,
                color: "yellow",
                weight: 4,
              }),
              (this.onclick_style = {
                stroke: true,
                color: "blue",
                weight: 4,
              });

            this.player = undefined;
            this.selected_track = undefined;
            this.vehicleMarker = undefined;
          },

          playMarker: function (track, videoUrl) {
            that = this;
            clearInterval(this.pf);
            this.pf = setInterval(async function () {
              if (typeof that.player.seekTo === "function") {
                var videoSrc = that.player.playerInfo.videoUrl;
                // console.log(videoUrl, videoSrc);
                // if(videoUrl != videoSrc){
                //   console.log('somehting wrong track src and json url');
                //   clearInterval(this.pf);
                // }
                let ppos = await findCTOnTrack(
                  that.player.playerInfo.currentTime,
                  track
                );
                if (this.vehicleMarker == undefined) {
                  this.vehicleMarker = L.marker(ppos).addTo(map);
                }
                this.vehicleMarker.setLatLng(ppos);
              } else if (
                that.player.type == "video/mp4" ||
                "video/ogg" ||
                "video/webm"
              ) {
                var videoSrc = that.player.currentSrc;
                if (videoUrl != videoSrc) {
                  console.log("somehting wrong track src and json url");
                  clearInterval(this.pf);
                }
                let ppos = await findCTOnTrack(that.player.currentTime, track);
                if (this.vehicleMarker == undefined) {
                  this.vehicleMarker = L.marker(ppos).addTo(map);
                }
                this.vehicleMarker.setLatLng(ppos);
              } else {
                console.log("seems video src not set up yet");
              }
            }, 1000);
          },

          onPlayerStateChange: function (event) {
            // console.log(this.player.playerInfo.currentTime);
            // console.log(event);
            if (event.data == YT.PlayerState.PLAYING && !done) {
              // setTimeout(stopVideo, 6000);
              done = true;
            }
            // playMarker();
          },

          // if use drawTrack function within class, mouseover and click are not working
          drawTrack: function (that = this, div_id) {
            var vectorGrid = L.vectorGrid
              .slicer(that.lineString, {
                maxZoom: 18,
                rendererFactory: L.svg.tile,
                vectorTileLayerStyles: {
                  sliced: function (properties, zoom) {
                    return that.regular_style;
                  },
                },
                interactive: true,
                getFeatureId: function (f) {
                  return f.properties.id;
                },
              })
              .on("click", async function (e) {
                if (e.layer.properties.video.url == undefined) {
                  alert("Video link not added yet!");
                  return;
                }
                let l = findPosOnTrack(e.latlng, e.layer.properties.track);
                if (e.layer.properties.id != that.selected_track) {
                  if (that.selected_track) {
                    // console.log("old_track", that.selected_track);
                    this.setFeatureStyle(
                      this.selected_track,
                      this.regular_style
                    );
                  }
                  that.selected_track = e.layer.properties.id;
                  this.setFeatureStyle(
                    e.layer.properties.id,
                    that.onclick_style
                  );
                  // console.log("new_track", that.selected_track, e.layer.properties.video.url);
                  let video_id = youtube_parser(e.layer.properties.video.url);
                  if (
                    (e.layer.properties.video.source = "youtube" && video_id)
                  ) {
                    that.player = await YTvideo("vplayer", video_id, l, that);
                    // console.log(that.player, that.player.getVideoUrl());
                    that.player.addEventListener(
                      "onReady",
                      that.playMarker(
                        e.layer.properties.track,
                        that.player.playerInfo.videoUrl
                      )
                    );
                  } else if ((e.layer.properties.video.source = "html5")) {
                    that.player = await html5video(
                      "vplayer",
                      e.layer.properties.video.url
                    );
                    that.player.currentTime = Math.floor(l / 1000);
                    // console.log(that.player, that.player.src, 'clicked');
                    that.player.addEventListener(
                      "onplay",
                      that.playMarker(e.layer.properties.track, that.player.src)
                    );
                  }
                } else {
                  // console.log("same_track", that.selected_track);
                  console.log(that.player);
                  if (typeof that.player.seekTo === "function") {
                    that.player.seekTo(Math.floor(l / 1000));
                  } else if ((e.layer.properties.video.source = "html5")) {
                    that.player.currentTime = Math.floor(l / 1000);
                  } else {
                    console.log("somehting wrong video source type");
                    return;
                  }
                }
              })
              .on("mouseover", async function (e) {
                // L.popup().setContent(e.layer.properties.id)
                // .setLatLng(e.latlng)
                // .openOn(map);
                if (that.selected_track != e.layer.properties.id) {
                  this.setFeatureStyle(
                    e.layer.properties.id,
                    that.mouseover_style
                  );
                }
              })
              .on("mouseout", function (e) {
                if (that.selected_track != e.layer.properties.id) {
                  vectorGrid.resetFeatureStyle(e.layer.properties.id);
                }
                map.closePopup();
              });

            vectorGrid.getLayers = function () {
              return new Promise((resolve, reject) => {
                vectorGrid.on("load", function () {
                  var layers = Object.keys(this._vectorTiles).map((key) => {
                    return this._vectorTiles[key]._layers;
                  });

                  var filterLayer = layers.filter((l) => {
                    return Object.keys(l).length > 0;
                  });

                  resolve(filterLayer);
                });
              });
            };

            // map.fitBounds(L.geoJSON(lineString).getBounds());
            return vectorGrid;
          },

          addTrack: function () {
            return drawTrack(this.lineString);
          },
        });

        L.VideoMaps.addTrack = function (lineString, options) {
          var res = new L.VideoMaps(lineString, options);
          return res.addTrack();
        };

        L.VideoMaps.drawTrack = function (lineString, div_id, options) {
          var res = new L.VideoMaps(lineString, div_id, options);
          return res.drawTrack();
        };
      },
      {},
    ],
  },
  {},
  [1]
);
